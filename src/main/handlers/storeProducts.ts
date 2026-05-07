import { ipcMain } from 'electron'
import { getDatabase } from '../database'
import { toCamel, generateEncryptedId } from './utils'
import type {
  StoreProductDbRow,
  StoreProductFilters,
  StoreProductFormData
} from '../../renderer/src/models/storeProduct'

const SORTABLE_COLUMNS: Partial<Record<string, string>> = {
  name: 'name',
  stock_quantity: 'stock_quantity',
  price: 'price'
}

function buildOrderBy(sortBy?: string, sortDir?: string): string {
  const col = SORTABLE_COLUMNS[sortBy ?? '']
  if (!col) return 'ORDER BY name ASC'
  const dir = sortDir === 'desc' ? 'DESC' : sortDir === 'asc' ? 'ASC' : ''
  return col === 'name' ? `ORDER BY name ${dir}` : `ORDER BY ${col} ${dir}, name ASC`
}

function buildProductFilters(filters: Partial<StoreProductFilters>): {
  where: string
  params: (string | number)[]
} {
  const conditions: string[] = []
  const params: (string | number)[] = []

  if (filters.query?.trim()) {
    conditions.push('name LIKE ?')
    params.push(`%${filters.query.trim()}%`)
  }

  if (filters.category && filters.category !== 'all') {
    conditions.push('category = ?')
    params.push(filters.category)
  }

  if (filters.inStockOnly) {
    conditions.push('stock_quantity > 0')
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
  return { where, params }
}

const PRODUCT_COLUMNS =
  'id, name, description, category, price, cost_price, stock_quantity, created_at, updated_at'

function queryProducts(
  page: number,
  filters: Partial<StoreProductFilters>,
  limit: number,
  orderBy: string
): { products: ReturnType<typeof toCamel>[]; total: number; page: number; totalPages: number } {
  const db = getDatabase()
  const offset = (page - 1) * limit
  const { where, params } = buildProductFilters(filters)

  const rows = db
    .prepare(
      `SELECT ${PRODUCT_COLUMNS} FROM store_products ${where} ${orderBy} LIMIT ? OFFSET ?`
    )
    .all(...params, limit, offset) as StoreProductDbRow[]

  const { total } = db
    .prepare(`SELECT COUNT(*) as total FROM store_products ${where}`)
    .get(...params) as { total: number }

  return {
    products: rows.map((r) => toCamel(r)),
    total,
    page,
    totalPages: Math.ceil(total / limit)
  }
}

export function registerStoreProductHandlers() {
  // POS grid — fixed name order, 15 per page
  ipcMain.handle(
    'store-products:getAll',
    async (_event, page: number = 1, filters: Partial<StoreProductFilters> = {}) =>
      queryProducts(page, filters, 15, 'ORDER BY name ASC')
  )

  // Management table — sortable, 10 per page
  ipcMain.handle(
    'store-products:get',
    async (_event, page: number = 1, filters: Partial<StoreProductFilters> = {}) =>
      queryProducts(page, filters, 10, buildOrderBy(filters.sortBy, filters.sortDir))
  )

  ipcMain.handle('store-products:create', async (_event, data: StoreProductFormData) => {
    const db = getDatabase()
    const id = generateEncryptedId()

    db.prepare(
      `INSERT INTO store_products (id, name, description, category, price, cost_price, stock_quantity)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id,
      data.name,
      data.description ?? null,
      data.category,
      data.price,
      data.costPrice,
      data.stockQuantity
    )

    return { id, ...data }
  })

  ipcMain.handle(
    'store-products:update',
    async (_event, id: string, data: StoreProductFormData) => {
      const db = getDatabase()

      db.prepare(
        `UPDATE store_products
         SET name = ?, description = ?, category = ?, price = ?, cost_price = ?, stock_quantity = ?
         WHERE id = ?`
      ).run(
        data.name,
        data.description ?? null,
        data.category,
        data.price,
        data.costPrice,
        data.stockQuantity,
        id
      )

      return { id, ...data }
    }
  )

  ipcMain.handle('store-products:delete', async (_event, id: string) => {
    const db = getDatabase()
    db.prepare('DELETE FROM store_products WHERE id = ?').run(id)
    return { success: true }
  })

  // Adjust stock quantity (+/-)
  ipcMain.handle('store-products:adjustStock', async (_event, id: string, delta: number) => {
    const db = getDatabase()

    const row = db.prepare('SELECT stock_quantity FROM store_products WHERE id = ?').get(id) as
      | { stock_quantity: number }
      | undefined

    if (!row) throw new Error('Product not found')

    const next = row.stock_quantity + delta
    if (next < 0) throw new Error('Stock cannot go below zero')

    db.prepare('UPDATE store_products SET stock_quantity = ? WHERE id = ?').run(next, id)
    return { id, stockQuantity: next }
  })
}
