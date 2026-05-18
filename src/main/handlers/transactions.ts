import { ipcMain } from 'electron'
import { getDatabase } from '../database'
import { generateEncryptedId } from './utils'
import type {
  TransactionDbRow,
  TransactionFilters,
  TransactionFormData
} from '../../renderer/src/models/transaction'

const PAGE_SIZE = 15

export function registerTransactionHandlers() {
  ipcMain.handle(
    'transactions:get',
    async (_event, page: number = 1, filters: TransactionFilters) => {
      const db = getDatabase()
      const offset = (page - 1) * PAGE_SIZE
      const conditions: string[] = []
      const params: (string | number)[] = []

      if (filters.query?.trim()) {
        const q = `%${filters.query.trim()}%`
        conditions.push('(description LIKE ? OR reference LIKE ?)')
        params.push(q, q)
      }
      if (filters.type !== 'all') {
        conditions.push('type = ?')
        params.push(filters.type)
      }
      if (filters.category !== 'all') {
        if (filters.category === 'other') {
          const standardCategories = [
            'inventory_purchase', 'rent', 'utilities', 'salaries',
            'equipment', 'maintenance', 'marketing'
          ]
          conditions.push(`category NOT IN (${standardCategories.map(() => '?').join(',')})`)
          params.push(...standardCategories)
        } else {
          conditions.push('category = ?')
          params.push(filters.category)
        }
      }
      if (filters.dateFrom) {
        conditions.push('date >= ?')
        params.push(filters.dateFrom)
      }
      if (filters.dateTo) {
        conditions.push('date <= ?')
        params.push(filters.dateTo)
      }

      const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

      const { total } = db
        .prepare(`SELECT COUNT(*) as total FROM transactions ${where}`)
        .get(...params) as { total: number }

      const rows = db
        .prepare(
          `SELECT * FROM transactions ${where} ORDER BY date DESC, created_at DESC LIMIT ? OFFSET ?`
        )
        .all(...params, PAGE_SIZE, offset) as TransactionDbRow[]

      const transactions = rows.map((row) => ({
        id: row.id,
        type: row.type,
        category: row.category,
        amount: row.amount,
        date: row.date,
        description: row.description ?? undefined,
        paymentMethod: row.payment_method ?? undefined,
        reference: row.reference ?? undefined,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }))

      return { transactions, totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)), total }
    }
  )

  ipcMain.handle('transactions:create', async (_event, data: TransactionFormData) => {
    const db = getDatabase()
    const id = generateEncryptedId()

    db.prepare(
      `INSERT INTO transactions (id, type, category, amount, date, description, payment_method, reference)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id,
      data.type,
      data.category,
      data.amount,
      data.date,
      data.description ?? null,
      data.paymentMethod ?? null,
      data.reference ?? null
    )

    return { id }
  })

  ipcMain.handle(
    'transactions:update',
    async (_event, id: string, data: TransactionFormData) => {
      const db = getDatabase()

      db.prepare(
        `UPDATE transactions
         SET type = ?, category = ?, amount = ?, date = ?, description = ?, payment_method = ?, reference = ?
         WHERE id = ?`
      ).run(
        data.type,
        data.category,
        data.amount,
        data.date,
        data.description ?? null,
        data.paymentMethod ?? null,
        data.reference ?? null,
        id
      )

      return { success: true }
    }
  )

  ipcMain.handle('transactions:delete', async (_event, id: string) => {
    const db = getDatabase()
    db.prepare('DELETE FROM transactions WHERE id = ?').run(id)
    return { success: true }
  })

  ipcMain.handle('transactions:bulkDelete', async (_event, ids: string[]) => {
    const db = getDatabase()
    const CHUNK = 500
    const deleteChunk = db.transaction((chunk: string[]) => {
      const placeholders = chunk.map(() => '?').join(',')
      db.prepare(`DELETE FROM transactions WHERE id IN (${placeholders})`).run(...chunk)
    })
    for (let i = 0; i < ids.length; i += CHUNK) {
      deleteChunk(ids.slice(i, i + CHUNK))
    }
    return { success: true }
  })

  ipcMain.handle('transactions:getNextReference', async () => {
    const db = getDatabase()
    const { maxRowid } = db
      .prepare('SELECT COALESCE(MAX(rowid), 0) as maxRowid FROM transactions')
      .get() as { maxRowid: number }
    const n = maxRowid + 1
    const encoded = ((n * 31337 + 17777) & 0xffffff).toString(16).toUpperCase().padStart(6, '0')
    return `TXN-${new Date().getFullYear()}-${encoded}`
  })

  ipcMain.handle('transactions:getMonthlySummary', async () => {
    const db = getDatabase()

    const thisMonthIncome = (
      db
        .prepare(
          `SELECT COALESCE(SUM(amount), 0) as total FROM transactions
           WHERE type = 'income' AND strftime('%Y-%m', date) = strftime('%Y-%m', 'now')`
        )
        .get() as { total: number }
    ).total

    const thisMonthExpenses = (
      db
        .prepare(
          `SELECT COALESCE(SUM(amount), 0) as total FROM transactions
           WHERE type = 'expense' AND strftime('%Y-%m', date) = strftime('%Y-%m', 'now')`
        )
        .get() as { total: number }
    ).total

    const lastMonthIncome = (
      db
        .prepare(
          `SELECT COALESCE(SUM(amount), 0) as total FROM transactions
           WHERE type = 'income' AND strftime('%Y-%m', date) = strftime('%Y-%m', 'now', '-1 month')`
        )
        .get() as { total: number }
    ).total

    const lastMonthExpenses = (
      db
        .prepare(
          `SELECT COALESCE(SUM(amount), 0) as total FROM transactions
           WHERE type = 'expense' AND strftime('%Y-%m', date) = strftime('%Y-%m', 'now', '-1 month')`
        )
        .get() as { total: number }
    ).total

    return { thisMonthIncome, thisMonthExpenses, lastMonthIncome, lastMonthExpenses }
  })
}
