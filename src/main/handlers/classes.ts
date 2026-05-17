import { ipcMain } from 'electron'
import { getDatabase } from '../database'
import { toCamel, generateEncryptedId } from './utils'
import type {
  ClassRuleDbRow,
  ClassInstanceDbRow,
  ClassSubscriberDbRow,
  ClassRuleFilters,
  ClassSubscriberFilters,
  ClassRuleFormData,
  ClassInstanceFormData,
  ClassSubscriberFormData,
  ClassPlanType
} from '../../renderer/src/models/classRule'

const PAGE_SIZE = 10

const SUBSCRIBER_SELECT_FIELDS = `
  cs.id, cs.member_id, m.name as member_name, m.phone as member_phone,
  m.country_code as member_country_code,
  cs.rule_id, cs.instance_id,
  COALESCE(cr.name, ci.name) as class_name,
  COALESCE(cr.category, ci.category) as category,
  COALESCE(cr.color, ci.color) as color,
  cs.plan_type, cs.amount, cs.amount_paid, cs.is_partial_payment, cs.created_at
`

const SUBSCRIBER_JOINS = `
  FROM class_subscribers cs
  JOIN members m ON m.id = cs.member_id
  LEFT JOIN class_rules cr ON cr.id = cs.rule_id
  LEFT JOIN class_instances ci ON ci.id = cs.instance_id
`

function toLocalDateStr(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function findFirstOccurrence(startDate: string, dayOfWeek: number): string {
  const date = new Date(startDate + 'T00:00:00')
  const daysUntil = (dayOfWeek - date.getDay() + 7) % 7
  date.setDate(date.getDate() + daysUntil)
  return toLocalDateStr(date)
}

function addDays(dateStr: string, days: number): string {
  const date = new Date(dateStr + 'T00:00:00')
  date.setDate(date.getDate() + days)
  return toLocalDateStr(date)
}

function lastDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}

function ok<T>(data: T) {
  return { success: true as const, data }
}

function fail(e: unknown) {
  const error = e instanceof Error ? e : new Error(String(e))
  return { success: false as const, error: { name: error.name, message: error.message } }
}

function mapInstanceRow(r: ClassInstanceDbRow & { subscriber_count: number }) {
  return {
    ...toCamel(r),
    isRecurring: r.is_recurring === 1,
    subscriberCount: r.subscriber_count
  }
}

function mapSubscriberRow(r: ClassSubscriberDbRow & { class_name: string; category: string; color: string; member_country_code: string }) {
  return { ...toCamel(r), isPartialPayment: r.is_partial_payment === 1 }
}

export function registerClassHandlers(): void {
  // ─── Rules ────────────────────────────────────────────────────────────────

  ipcMain.handle('classes:getRules', async (_event, page: number = 1, filters: ClassRuleFilters) => {
    try {
      const db = getDatabase()
      const offset = (page - 1) * PAGE_SIZE
      const conditions: string[] = []
      const params: (string | number)[] = []

      if (filters.query?.trim()) {
        const q = `%${filters.query.trim()}%`
        conditions.push('(cr.name LIKE ? OR cr.category LIKE ? OR cr.coach_name LIKE ?)')
        params.push(q, q, q)
      }

      if (filters.status !== 'all') {
        conditions.push('cr.status = ?')
        params.push(filters.status)
      }

      const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

      const rows = db.prepare(`
        SELECT cr.*,
          GROUP_CONCAT(crd.day_of_week) as days_concat,
          COUNT(DISTINCT cs.id) as subscriber_count
        FROM class_rules cr
        LEFT JOIN class_rule_days crd ON crd.rule_id = cr.id
        LEFT JOIN class_subscribers cs ON cs.rule_id = cr.id
        ${where}
        GROUP BY cr.id
        ORDER BY cr.created_at DESC
        LIMIT ? OFFSET ?
      `).all(...params, PAGE_SIZE, offset) as (ClassRuleDbRow & {
        days_concat: string | null
        subscriber_count: number
      })[]

      const { total } = db.prepare(
        `SELECT COUNT(*) as total FROM class_rules cr ${where}`
      ).get(...params) as { total: number }

      const rules = rows.map((row) => ({
        ...toCamel(row),
        days: row.days_concat ? row.days_concat.split(',').map(Number) : [],
        subscriberCount: row.subscriber_count
      }))

      return ok({ rules, total, page, totalPages: Math.ceil(total / PAGE_SIZE) })
    } catch (e) {
      return fail(e)
    }
  })

  ipcMain.handle('classes:getRuleById', async (_event, id: string) => {
    try {
      const db = getDatabase()
      const row = db.prepare('SELECT * FROM class_rules WHERE id = ?').get(id) as ClassRuleDbRow | undefined
      if (!row) return fail(new Error('Rule not found'))

      const days = (
        db.prepare('SELECT day_of_week FROM class_rule_days WHERE rule_id = ?').all(id) as {
          day_of_week: number
        }[]
      ).map((d) => d.day_of_week)

      return ok({ ...toCamel(row), days })
    } catch (e) {
      return fail(e)
    }
  })

  ipcMain.handle('classes:createRule', async (_event, data: ClassRuleFormData) => {
    try {
      const db = getDatabase()

      const createRule = db.transaction(() => {
        const ruleId = generateEncryptedId()

        db.prepare(`
          INSERT INTO class_rules
            (id, name, category, color, coach_name, start_date, start_time,
             price_per_class, price_per_week, price_per_month, price_per_year)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          ruleId,
          data.name,
          data.category,
          data.color,
          data.coachName,
          data.startDate,
          data.startTime ?? null,
          data.pricePerClass ?? null,
          data.pricePerWeek ?? null,
          data.pricePerMonth ?? null,
          data.pricePerYear ?? null
        )

        for (const day of data.days) {
          db.prepare(
            'INSERT INTO class_rule_days (id, rule_id, day_of_week) VALUES (?, ?, ?)'
          ).run(generateEncryptedId(), ruleId, day)

          const scheduledDate = findFirstOccurrence(data.startDate, day)
          db.prepare(`
            INSERT OR IGNORE INTO class_instances
              (id, rule_id, name, category, color, coach_name, scheduled_date, day_of_week, is_recurring, status, start_time)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 'upcoming', ?)
          `).run(
            generateEncryptedId(),
            ruleId,
            data.name,
            data.category,
            data.color,
            data.coachName,
            scheduledDate,
            day,
            data.startTime ?? null
          )
        }

        for (const sub of data.subscribers ?? []) {
          db.prepare(`
            INSERT INTO class_subscribers
              (id, member_id, rule_id, plan_type, amount, amount_paid, is_partial_payment)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `).run(
            generateEncryptedId(),
            sub.memberId,
            ruleId,
            sub.planType,
            sub.amount,
            sub.isPartialPayment ? Math.min(sub.amountPaid, sub.amount) : sub.amount,
            sub.isPartialPayment ? 1 : 0
          )
        }

        return db.prepare('SELECT * FROM class_rules WHERE id = ?').get(ruleId) as ClassRuleDbRow
      })

      const rule = createRule()
      const days = (
        db.prepare('SELECT day_of_week FROM class_rule_days WHERE rule_id = ?').all(rule.id) as {
          day_of_week: number
        }[]
      ).map((d) => d.day_of_week)

      return ok({ ...toCamel(rule), days })
    } catch (e) {
      return fail(e)
    }
  })

  ipcMain.handle('classes:updateRule', async (_event, id: string, data: Partial<ClassRuleFormData>) => {
    try {
      const db = getDatabase()

      db.prepare(`
        UPDATE class_rules SET
          name = COALESCE(?, name),
          category = COALESCE(?, category),
          color = COALESCE(?, color),
          coach_name = COALESCE(?, coach_name),
          start_date = COALESCE(?, start_date),
          start_time = ?,
          price_per_class = ?,
          price_per_week = ?,
          price_per_month = ?,
          price_per_year = ?
        WHERE id = ?
      `).run(
        data.name ?? null,
        data.category ?? null,
        data.color ?? null,
        data.coachName ?? null,
        data.startDate ?? null,
        data.startTime ?? null,
        data.pricePerClass ?? null,
        data.pricePerWeek ?? null,
        data.pricePerMonth ?? null,
        data.pricePerYear ?? null,
        id
      )

      const row = db.prepare('SELECT * FROM class_rules WHERE id = ?').get(id) as ClassRuleDbRow
      const days = (
        db.prepare('SELECT day_of_week FROM class_rule_days WHERE rule_id = ?').all(id) as {
          day_of_week: number
        }[]
      ).map((d) => d.day_of_week)

      return ok({ ...toCamel(row), days })
    } catch (e) {
      return fail(e)
    }
  })

  ipcMain.handle('classes:deleteRule', async (_event, id: string) => {
    try {
      const db = getDatabase()
      db.prepare('DELETE FROM class_rules WHERE id = ?').run(id)
      return ok({ deleted: true })
    } catch (e) {
      return fail(e)
    }
  })

  ipcMain.handle('classes:deleteRules', async (_event, ids: string[]) => {
    try {
      const db = getDatabase()
      const deleteAll = db.transaction(() => {
        const stmt = db.prepare('DELETE FROM class_rules WHERE id = ?')
        for (const id of ids) stmt.run(id)
      })
      deleteAll()
      return ok({ deleted: ids.length })
    } catch (e) {
      return fail(e)
    }
  })

  ipcMain.handle('classes:completeRule', async (_event, id: string) => {
    try {
      const db = getDatabase()
      db.prepare("UPDATE class_rules SET status = 'completed' WHERE id = ?").run(id)
      const row = db.prepare('SELECT * FROM class_rules WHERE id = ?').get(id) as ClassRuleDbRow
      const days = (
        db.prepare('SELECT day_of_week FROM class_rule_days WHERE rule_id = ?').all(id) as {
          day_of_week: number
        }[]
      ).map((d) => d.day_of_week)
      return ok({ ...toCamel(row), days })
    } catch (e) {
      return fail(e)
    }
  })

  // ─── Instances ────────────────────────────────────────────────────────────

  ipcMain.handle('classes:getInstancesByMonth', async (_event, year: number, month: number) => {
    try {
      const db = getDatabase()
      const pad = (n: number) => String(n).padStart(2, '0')
      const from = `${year}-${pad(month)}-01`
      const to = `${year}-${pad(month)}-${lastDayOfMonth(year, month)}`

      const rows = db.prepare(`
        SELECT ci.*, COUNT(DISTINCT cs.id) as subscriber_count
        FROM class_instances ci
        LEFT JOIN class_subscribers cs ON cs.instance_id = ci.id
        WHERE ci.scheduled_date BETWEEN ? AND ?
        GROUP BY ci.id
        ORDER BY ci.scheduled_date, ci.created_at
      `).all(from, to) as (ClassInstanceDbRow & { subscriber_count: number })[]

      return ok(rows.map(mapInstanceRow))
    } catch (e) {
      return fail(e)
    }
  })

  ipcMain.handle('classes:getInstancesByDate', async (_event, date: string) => {
    try {
      const db = getDatabase()
      const rows = db.prepare(`
        SELECT ci.*, COUNT(DISTINCT cs.id) as subscriber_count
        FROM class_instances ci
        LEFT JOIN class_subscribers cs ON cs.instance_id = ci.id
        WHERE ci.scheduled_date = ?
        GROUP BY ci.id
        ORDER BY ci.created_at
      `).all(date) as (ClassInstanceDbRow & { subscriber_count: number })[]

      return ok(rows.map(mapInstanceRow))
    } catch (e) {
      return fail(e)
    }
  })

  ipcMain.handle('classes:createInstance', async (_event, data: ClassInstanceFormData) => {
    try {
      const db = getDatabase()

      const create = db.transaction(() => {
        const instanceId = generateEncryptedId()
        db.prepare(`
          INSERT INTO class_instances
            (id, rule_id, name, category, color, coach_name, scheduled_date, day_of_week, is_recurring, status,
             start_time, price_per_class, price_per_week, price_per_month, price_per_year)
          VALUES (?, NULL, ?, ?, ?, ?, ?, ?, 0, 'upcoming', ?, ?, ?, ?, ?)
        `).run(
          instanceId,
          data.name,
          data.category,
          data.color,
          data.coachName,
          data.scheduledDate,
          data.dayOfWeek ?? null,
          data.startTime ?? null,
          data.pricePerClass ?? null,
          data.pricePerWeek ?? null,
          data.pricePerMonth ?? null,
          data.pricePerYear ?? null
        )

        for (const sub of data.subscribers ?? []) {
          db.prepare(`
            INSERT INTO class_subscribers
              (id, member_id, instance_id, plan_type, amount, amount_paid, is_partial_payment)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `).run(
            generateEncryptedId(),
            sub.memberId,
            instanceId,
            sub.planType,
            sub.amount,
            sub.isPartialPayment ? Math.min(sub.amountPaid, sub.amount) : sub.amount,
            sub.isPartialPayment ? 1 : 0
          )
        }

        return db
          .prepare('SELECT * FROM class_instances WHERE id = ?')
          .get(instanceId) as ClassInstanceDbRow
      })

      const row = create()
      return ok({ ...toCamel(row), isRecurring: false })
    } catch (e) {
      return fail(e)
    }
  })

  ipcMain.handle('classes:updateInstance', async (_event, id: string, data: Partial<ClassInstanceFormData>) => {
    try {
      const db = getDatabase()
      db.prepare(`
        UPDATE class_instances SET
          name = COALESCE(?, name),
          category = COALESCE(?, category),
          color = COALESCE(?, color),
          coach_name = COALESCE(?, coach_name),
          scheduled_date = COALESCE(?, scheduled_date),
          start_time = ?
        WHERE id = ?
      `).run(
        data.name ?? null,
        data.category ?? null,
        data.color ?? null,
        data.coachName ?? null,
        data.scheduledDate ?? null,
        data.startTime ?? null,
        id
      )
      const row = db.prepare('SELECT * FROM class_instances WHERE id = ?').get(id) as ClassInstanceDbRow
      return ok({ ...toCamel(row), isRecurring: row.is_recurring === 1 })
    } catch (e) {
      return fail(e)
    }
  })

  ipcMain.handle('classes:deleteInstance', async (_event, id: string) => {
    try {
      const db = getDatabase()
      db.prepare('DELETE FROM class_instances WHERE id = ?').run(id)
      return ok({ deleted: true })
    } catch (e) {
      return fail(e)
    }
  })

  ipcMain.handle('classes:completeInstance', async (_event, id: string) => {
    try {
      const db = getDatabase()

      const complete = db.transaction(() => {
        db.prepare("UPDATE class_instances SET status = 'completed' WHERE id = ?").run(id)
        const instance = db.prepare('SELECT * FROM class_instances WHERE id = ?').get(
          id
        ) as ClassInstanceDbRow

        let nextInstance: Record<string, unknown> | null = null

        if (instance.is_recurring === 1 && instance.rule_id && instance.day_of_week !== null) {
          const rule = db
            .prepare("SELECT * FROM class_rules WHERE id = ? AND status = 'active'")
            .get(instance.rule_id) as ClassRuleDbRow | undefined

          if (rule) {
            const nextDate = addDays(instance.scheduled_date, 7)
            const nextId = generateEncryptedId()

            // INSERT OR IGNORE relies on the unique index idx_unique_recurring_instance
            const result = db.prepare(`
              INSERT OR IGNORE INTO class_instances
                (id, rule_id, name, category, color, coach_name, scheduled_date, day_of_week, is_recurring, status, start_time)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 'upcoming', ?)
            `).run(
              nextId,
              instance.rule_id,
              instance.name,
              instance.category,
              instance.color,
              instance.coach_name,
              nextDate,
              instance.day_of_week,
              instance.start_time ?? null
            )

            if (result.changes > 0) {
              const nextRow = db
                .prepare('SELECT * FROM class_instances WHERE id = ?')
                .get(nextId) as ClassInstanceDbRow
              nextInstance = { ...toCamel(nextRow), isRecurring: true }
            }
          }
        }

        return {
          instance: { ...toCamel(instance), isRecurring: instance.is_recurring === 1 },
          nextInstance
        }
      })

      return ok(complete())
    } catch (e) {
      return fail(e)
    }
  })

  ipcMain.handle('classes:processPastDue', async () => {
    try {
      const db = getDatabase()
      // Limit lookback to 30 days to prevent unbounded processing of historical data
      const pastDue = db
        .prepare(
          `SELECT * FROM class_instances
           WHERE status = 'upcoming'
             AND scheduled_date BETWEEN DATE('now', '-30 days') AND DATE('now', '-1 day')`
        )
        .all() as ClassInstanceDbRow[]

      const process = db.transaction(() => {
        const insertNext = db.prepare(`
          INSERT OR IGNORE INTO class_instances
            (id, rule_id, name, category, color, coach_name, scheduled_date, day_of_week, is_recurring, status, start_time)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 'upcoming', ?)
        `)

        let count = 0
        for (const instance of pastDue) {
          db.prepare("UPDATE class_instances SET status = 'completed' WHERE id = ?").run(
            instance.id
          )

          if (
            instance.is_recurring === 1 &&
            instance.rule_id &&
            instance.day_of_week !== null
          ) {
            const rule = db
              .prepare("SELECT * FROM class_rules WHERE id = ? AND status = 'active'")
              .get(instance.rule_id) as ClassRuleDbRow | undefined

            if (rule) {
              // INSERT OR IGNORE handles the race condition via the unique index
              insertNext.run(
                generateEncryptedId(),
                instance.rule_id,
                instance.name,
                instance.category,
                instance.color,
                instance.coach_name,
                addDays(instance.scheduled_date, 7),
                instance.day_of_week,
                instance.start_time ?? null
              )
            }
          }
          count++
        }
        return count
      })

      return ok({ processed: process() })
    } catch (e) {
      return fail(e)
    }
  })

  // ─── Subscribers ──────────────────────────────────────────────────────────

  ipcMain.handle('classes:getSubscribers', async (_event, page: number = 1, filters: ClassSubscriberFilters) => {
    try {
      const db = getDatabase()
      const offset = (page - 1) * PAGE_SIZE
      const conditions: string[] = []
      const params: (string | number)[] = []

      if (filters.query?.trim()) {
        const q = `%${filters.query.trim()}%`
        conditions.push('(m.name LIKE ? OR m.phone LIKE ? OR m.country_code LIKE ?)')
        params.push(q, q, q)
      }

      if (filters.className?.trim()) {
        conditions.push('COALESCE(cr.name, ci.name) = ?')
        params.push(filters.className.trim())
      }

      const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

      const rows = db.prepare(`
        SELECT ${SUBSCRIBER_SELECT_FIELDS}
        ${SUBSCRIBER_JOINS}
        ${where}
        ORDER BY cs.created_at DESC
        LIMIT ? OFFSET ?
      `).all(...params, PAGE_SIZE, offset) as (ClassSubscriberDbRow & {
        class_name: string
        category: string
        color: string
        member_country_code: string
      })[]

      const { total } = db.prepare(`
        SELECT COUNT(*) as total
        ${SUBSCRIBER_JOINS}
        ${where}
      `).get(...params) as { total: number }

      return ok({
        subscribers: rows.map(mapSubscriberRow),
        total,
        page,
        totalPages: Math.ceil(total / PAGE_SIZE)
      })
    } catch (e) {
      return fail(e)
    }
  })

  ipcMain.handle('classes:getSubscriberClasses', async (_event, memberId: string) => {
    try {
      const db = getDatabase()
      const rows = db.prepare(`
        SELECT ${SUBSCRIBER_SELECT_FIELDS}
        ${SUBSCRIBER_JOINS}
        WHERE cs.member_id = ?
        ORDER BY cs.created_at DESC
      `).all(memberId) as (ClassSubscriberDbRow & {
        class_name: string
        category: string
        color: string
        member_country_code: string
      })[]

      return ok(rows.map(mapSubscriberRow))
    } catch (e) {
      return fail(e)
    }
  })

  ipcMain.handle('classes:getDistinctClassNames', async () => {
    try {
      const db = getDatabase()
      const rows = db.prepare(`
        SELECT DISTINCT name FROM (
          SELECT name FROM class_rules
          UNION
          SELECT name FROM class_instances
        ) ORDER BY name ASC
      `).all() as { name: string }[]
      return ok(rows.map((r) => r.name))
    } catch (e) {
      return fail(e)
    }
  })

  ipcMain.handle('classes:getMemberClassInstances', async (_event, memberId: string) => {
    try {
      const db = getDatabase()
      const rows = db.prepare(`
        SELECT DISTINCT
          ci.id, ci.name, ci.category, ci.color,
          ci.scheduled_date, ci.status, ci.is_recurring, ci.start_time
        FROM class_subscribers cs
        LEFT JOIN class_instances ci ON (
          (cs.rule_id IS NOT NULL AND ci.rule_id = cs.rule_id)
          OR
          (cs.instance_id IS NOT NULL AND ci.id = cs.instance_id)
        )
        WHERE cs.member_id = ? AND ci.id IS NOT NULL
        ORDER BY ci.scheduled_date DESC
      `).all(memberId) as {
        id: string
        name: string
        category: string
        color: string
        scheduled_date: string
        status: 'upcoming' | 'completed'
        is_recurring: number
        start_time: string | null
      }[]
      return ok(
        rows.map((r) => ({
          id: r.id,
          name: r.name,
          category: r.category,
          color: r.color,
          scheduledDate: r.scheduled_date,
          status: r.status,
          isRecurring: r.is_recurring === 1,
          startTime: r.start_time
        }))
      )
    } catch (e) {
      return fail(e)
    }
  })

  ipcMain.handle('classes:addSubscriberToRule', async (_event, ruleId: string, data: ClassSubscriberFormData) => {
    try {
      const db = getDatabase()
      const id = generateEncryptedId()
      db.prepare(`
        INSERT INTO class_subscribers
          (id, member_id, rule_id, plan_type, amount, amount_paid, is_partial_payment)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        id,
        data.memberId,
        ruleId,
        data.planType,
        data.amount,
        data.isPartialPayment ? Math.min(data.amountPaid, data.amount) : data.amount,
        data.isPartialPayment ? 1 : 0
      )
      const row = db
        .prepare('SELECT * FROM class_subscribers WHERE id = ?')
        .get(id) as ClassSubscriberDbRow
      return ok({ ...toCamel(row), isPartialPayment: row.is_partial_payment === 1 })
    } catch (e) {
      return fail(e)
    }
  })

  ipcMain.handle('classes:addSubscriberToInstance', async (_event, instanceId: string, data: ClassSubscriberFormData) => {
    try {
      const db = getDatabase()
      const id = generateEncryptedId()
      db.prepare(`
        INSERT INTO class_subscribers
          (id, member_id, instance_id, plan_type, amount, amount_paid, is_partial_payment)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        id,
        data.memberId,
        instanceId,
        data.planType,
        data.amount,
        data.isPartialPayment ? Math.min(data.amountPaid, data.amount) : data.amount,
        data.isPartialPayment ? 1 : 0
      )
      const row = db
        .prepare('SELECT * FROM class_subscribers WHERE id = ?')
        .get(id) as ClassSubscriberDbRow
      return ok({ ...toCamel(row), isPartialPayment: row.is_partial_payment === 1 })
    } catch (e) {
      return fail(e)
    }
  })

  ipcMain.handle('classes:removeSubscriber', async (_event, subscriberId: string) => {
    try {
      const db = getDatabase()
      db.prepare('DELETE FROM class_subscribers WHERE id = ?').run(subscriberId)
      return ok({ deleted: true })
    } catch (e) {
      return fail(e)
    }
  })

  ipcMain.handle('classes:markSubscriberPaid', async (_event, subscriberId: string) => {
    try {
      const db = getDatabase()
      db.prepare(`
        UPDATE class_subscribers
        SET amount_paid = amount, is_partial_payment = 0
        WHERE id = ?
      `).run(subscriberId)
      return ok({ updated: true })
    } catch (e) {
      return fail(e)
    }
  })

  ipcMain.handle('classes:getInstanceSubscribers', async (_event, instanceId: string) => {
    try {
      const db = getDatabase()
      const rows = db.prepare(`
        SELECT
          cs.id, cs.member_id, m.name as member_name, m.phone as member_phone,
          m.country_code as member_country_code,
          cs.plan_type, cs.amount, cs.amount_paid, cs.is_partial_payment, cs.created_at
        FROM class_subscribers cs
        JOIN members m ON m.id = cs.member_id
        WHERE cs.instance_id = ?
        ORDER BY cs.created_at ASC
      `).all(instanceId) as {
        id: string
        member_id: string
        member_name: string
        member_phone: string
        member_country_code: string
        plan_type: ClassPlanType
        amount: number
        amount_paid: number
        is_partial_payment: number
        created_at: string
      }[]

      return ok(
        rows.map((r) => ({
          id: r.id,
          memberId: r.member_id,
          memberName: r.member_name,
          memberPhone: r.member_phone,
          memberCountryCode: r.member_country_code,
          planType: r.plan_type,
          amount: r.amount,
          amountPaid: r.amount_paid,
          isPartialPayment: r.is_partial_payment === 1,
          createdAt: r.created_at
        }))
      )
    } catch (e) {
      return fail(e)
    }
  })
}
