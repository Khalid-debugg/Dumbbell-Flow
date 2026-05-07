import { ipcMain } from 'electron'
import { getDatabase } from '../database'
import { toCamel, generateEncryptedId } from './utils'
import type {
  SaleCartItem,
  StoreSaleDbRow,
  StoreSaleItemDbRow,
  StoreSaleFilters,
  PaymentMethod
} from '../../renderer/src/models/storeSale'

export function registerStoreSalesHandlers() {
  // Create a sale from cart items — runs in a transaction to keep stock in sync
  ipcMain.handle(
    'store-sales:create',
    async (
      _event,
      cart: SaleCartItem[],
      paymentMethod: PaymentMethod,
      memberId: string | null,
      notes: string | null
    ) => {
      const db = getDatabase()

      const createSale = db.transaction(() => {
        const saleId = generateEncryptedId()
        const totalAmount = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)

        db.prepare(
          `INSERT INTO store_sales (id, member_id, total_amount, payment_method, notes)
           VALUES (?, ?, ?, ?, ?)`
        ).run(saleId, memberId ?? null, totalAmount, paymentMethod, notes ?? null)

        // Pre-fetch all product stocks in one query to avoid N+1
        const placeholders = cart.map(() => '?').join(', ')
        const stockRows = db
          .prepare(`SELECT id, stock_quantity FROM store_products WHERE id IN (${placeholders})`)
          .all(...cart.map((item) => item.productId)) as { id: string; stock_quantity: number }[]

        const stockMap = new Map(stockRows.map((r) => [r.id, r.stock_quantity]))

        for (const item of cart) {
          const currentStock = stockMap.get(item.productId)
          if (currentStock === undefined) throw new Error(`Product ${item.productId} not found`)
          if (currentStock < item.quantity)
            throw new Error(`Insufficient stock for ${item.productName}`)

          db.prepare(
            `INSERT INTO store_sale_items (id, sale_id, product_id, product_name, quantity, unit_price, subtotal)
             VALUES (?, ?, ?, ?, ?, ?, ?)`
          ).run(
            generateEncryptedId(),
            saleId,
            item.productId,
            item.productName,
            item.quantity,
            item.unitPrice,
            item.unitPrice * item.quantity
          )

          db.prepare(
            'UPDATE store_products SET stock_quantity = stock_quantity - ? WHERE id = ?'
          ).run(item.quantity, item.productId)
        }

        return { saleId, totalAmount }
      })

      return createSale()
    }
  )

  // Paginated sales history with optional filters
  ipcMain.handle(
    'store-sales:get',
    async (_event, page: number = 1, filters: Partial<StoreSaleFilters> = {}) => {
      const db = getDatabase()
      const limit = 15
      const offset = (page - 1) * limit
      const conditions: string[] = []
      const params: (string | number)[] = []

      if (filters.dateFrom) {
        conditions.push('DATE(ss.sold_at) >= ?')
        params.push(filters.dateFrom)
      }

      if (filters.dateTo) {
        conditions.push('DATE(ss.sold_at) <= ?')
        params.push(filters.dateTo)
      }

      if (filters.paymentMethod && filters.paymentMethod !== 'all') {
        conditions.push('ss.payment_method = ?')
        params.push(filters.paymentMethod)
      }

      if (filters.memberId) {
        conditions.push('ss.member_id = ?')
        params.push(filters.memberId)
      }

      const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

      const rows = db
        .prepare(
          `SELECT ss.*, m.name as member_name
           FROM store_sales ss
           LEFT JOIN members m ON ss.member_id = m.id
           ${where}
           ORDER BY ss.sold_at DESC
           LIMIT ? OFFSET ?`
        )
        .all(...params, limit, offset) as StoreSaleDbRow[]

      const { total } = db
        .prepare(`SELECT COUNT(*) as total FROM store_sales ss ${where}`)
        .get(...params) as { total: number }

      return {
        sales: rows.map((r) => toCamel(r)),
        total,
        page,
        totalPages: Math.ceil(total / limit)
      }
    }
  )

  // Void a sale: restore stock for every line item, then delete the record
  ipcMain.handle('store-sales:delete', async (_event, id: string) => {
    const db = getDatabase()

    const voidSale = db.transaction(() => {
      const sale = db.prepare('SELECT id FROM store_sales WHERE id = ?').get(id) as
        | { id: string }
        | undefined
      if (!sale) throw new Error('Sale not found')

      const items = db
        .prepare('SELECT product_id, quantity FROM store_sale_items WHERE sale_id = ?')
        .all(id) as { product_id: string; quantity: number }[]

      const restoreStock = db.prepare(
        'UPDATE store_products SET stock_quantity = stock_quantity + ? WHERE id = ?'
      )
      for (const item of items) {
        restoreStock.run(item.quantity, item.product_id)
      }

      // CASCADE on store_sale_items.sale_id removes line items automatically
      db.prepare('DELETE FROM store_sales WHERE id = ?').run(id)

      return { success: true }
    })

    return voidSale()
  })

  // Single sale with its line items
  ipcMain.handle('store-sales:getById', async (_event, id: string) => {
    const db = getDatabase()

    const sale = db
      .prepare(
        `SELECT ss.*, m.name as member_name
         FROM store_sales ss
         LEFT JOIN members m ON ss.member_id = m.id
         WHERE ss.id = ?`
      )
      .get(id) as StoreSaleDbRow | undefined

    if (!sale) return null

    const items = db
      .prepare('SELECT * FROM store_sale_items WHERE sale_id = ? ORDER BY created_at ASC')
      .all(id) as StoreSaleItemDbRow[]

    return {
      ...toCamel(sale),
      items: items.map(toCamel)
    }
  })
}
