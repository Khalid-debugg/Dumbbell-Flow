import { ipcMain } from 'electron'
import { getDatabase } from '../database'
import type { MemberDbRow, MemberFilters } from '../../renderer/src/models/member'
import { toSnake, generateEncryptedId } from './utils'

export function registerMemberHandlers() {
  ipcMain.handle('members:get', async (_event, page: number = 1, filters: MemberFilters) => {
    const db = getDatabase()
    const limit = 10
    const offset = (page - 1) * limit

    const whereConditions: string[] = []
    const params: (string | number)[] = []

    if (filters.query?.trim()) {
      const search = `%${filters.query.trim()}%`
      whereConditions.push(
        "(m.name LIKE ? OR m.email LIKE ? OR (REPLACE(m.country_code, '+', '') || m.phone) LIKE ? OR m.address LIKE ? OR CAST(m.id AS TEXT) LIKE ?)"
      )
      params.push(search, search, search, search, search)
    }

    if (filters.gender !== 'all') {
      whereConditions.push('m.gender = ?')
      params.push(filters.gender)
    }

    if (filters.dateFrom) {
      whereConditions.push('m.join_date >= ?')
      params.push(filters.dateFrom)
    }

    if (filters.dateTo) {
      whereConditions.push('m.join_date <= ?')
      params.push(filters.dateTo)
    }

    // Build status filter condition for SQL
    if (filters.status !== 'all') {
      if (filters.status === 'active') {
        whereConditions.push("ms.end_date >= date('now') AND (ms.is_paused IS NULL OR ms.is_paused = 0)")
      } else if (filters.status === 'paused') {
        whereConditions.push("ms.end_date >= date('now') AND ms.is_paused = 1")
      } else if (filters.status === 'inactive') {
        whereConditions.push(
          `ms.id IS NULL AND (SELECT COUNT(*) FROM memberships WHERE member_id = m.id) = 0`
        )
      } else if (filters.status === 'expired') {
        whereConditions.push(
          `(ms.id IS NULL OR ms.end_date < date('now')) AND (SELECT COUNT(*) FROM memberships WHERE member_id = m.id) > 0`
        )
      }
    }

    const whereClause = whereConditions.length ? `WHERE ${whereConditions.join(' AND ')}` : ''

    const query = `
      SELECT
        m.*,
        ms.id AS membership_id,
        mp.name AS plan_name,
        mp.price AS plan_price,
        ms.start_date,
        ms.end_date,
        ms.remaining_check_ins,
        ms.is_paused,
        ms.pause_duration_days,
        (
          SELECT COUNT(*) FROM memberships WHERE member_id = m.id
        ) AS membership_count
      FROM members m
      LEFT JOIN memberships ms ON m.id = ms.member_id
        AND ms.id = (
          SELECT id FROM memberships
          WHERE member_id = m.id
          ORDER BY end_date DESC
          LIMIT 1
        )
      LEFT JOIN membership_plans mp ON ms.plan_id = mp.id
      ${whereClause}
      ORDER BY m.created_at DESC
      LIMIT ? OFFSET ?
    `

    const rows = db.prepare(query).all(...params, limit, offset) as MemberDbRow[]

    const processedMembers = rows.map((row) => {
      let status: 'active' | 'inactive' | 'expired' | 'paused' = 'inactive'
      const today = new Date().toISOString().split('T')[0]

      if (row.membership_id && row.end_date && row.end_date >= today) {
        if (row.is_paused === 1) {
          status = 'paused'
        } else {
          status = 'active'
        }
      } else if (row.membership_count > 0) {
        status = 'expired'
      }

      return {
        id: row.id,
        name: row.name,
        email: row.email,
        countryCode: row.country_code,
        phone: row.phone,
        gender: row.gender,
        address: row.address,
        joinDate: row.join_date,
        notes: row.notes,
        createdAt: row.created_at,
        status,
        currentMembership: row.membership_id
          ? {
              id: row.membership_id,
              planName: row.plan_name!,
              planPrice: row.plan_price!,
              startDate: row.start_date!,
              endDate: row.end_date!,
              remainingCheckIns: row.remaining_check_ins,
              isPaused: row.is_paused === 1,
              pauseDurationDays: row.pause_duration_days
            }
          : undefined
      }
    })

    // Count query should also include status condition
    const countQuery = `
      SELECT COUNT(*) as total
      FROM members m
      LEFT JOIN memberships ms ON m.id = ms.member_id
        AND ms.id = (
          SELECT id FROM memberships
          WHERE member_id = m.id
          ORDER BY end_date DESC
          LIMIT 1
        )
      ${whereClause}
    `
    const totalResult = db.prepare(countQuery).get(...params) as { total: number }

    return {
      members: processedMembers,
      total: totalResult.total,
      page,
      totalPages: Math.ceil(totalResult.total / limit)
    }
  })

  ipcMain.handle('members:getById', async (_event, id: string) => {
    const db = getDatabase()
    const row = db
      .prepare(
        `
        SELECT
          m.*,
          ms.id AS membership_id,
          mp.name AS plan_name,
          mp.price AS plan_price,
          ms.start_date,
          ms.end_date,
          ms.remaining_check_ins,
          ms.is_paused,
          (
            SELECT COUNT(*) FROM memberships WHERE member_id = m.id
          ) AS membership_count
        FROM members m
        LEFT JOIN memberships ms ON m.id = ms.member_id
          AND ms.end_date >= date('now')
        LEFT JOIN membership_plans mp ON ms.plan_id = mp.id
        WHERE m.id = ?
        `
      )
      .get(id) as MemberDbRow | undefined

    if (!row) return null

    let status: 'active' | 'inactive' | 'expired' | 'paused' = 'inactive'
    const today = new Date().toISOString().split('T')[0]
    if (row.membership_id && row.end_date && row.end_date >= today) {
      if (row.is_paused === 1) {
        status = 'paused'
      } else {
        status = 'active'
      }
    } else if (row.membership_count > 0) {
      status = 'expired'
    }

    return {
      id: row.id,
      name: row.name,
      email: row.email,
      countryCode: row.country_code,
      phone: row.phone,
      gender: row.gender,
      address: row.address,
      joinDate: row.join_date,
      notes: row.notes,
      createdAt: row.created_at,
      status,
      currentMembership: row.membership_id
        ? {
            id: row.membership_id,
            planName: row.plan_name!,
            planPrice: row.plan_price!,
            startDate: row.start_date!,
            endDate: row.end_date!,
            remainingCheckIns: row.remaining_check_ins,
            isPaused: row.is_paused === 1
          }
        : undefined
    }
  })

  ipcMain.handle('members:getNextId', async () => {
    const db = getDatabase()

    // Generate a unique encrypted ID
    let newId = generateEncryptedId()

    // Ensure the generated ID is unique (very unlikely to collide, but check anyway)
    let existing = db.prepare('SELECT id FROM members WHERE id = ?').get(newId)
    while (existing) {
      newId = generateEncryptedId()
      existing = db.prepare('SELECT id FROM members WHERE id = ?').get(newId)
    }

    return newId
  })

  ipcMain.handle('members:create', async (_event, member) => {
    const db = getDatabase()
    const snake = toSnake(member)

    // Generate an encrypted ID if none is provided
    let memberId: string
    if (member.id) {
      // Custom ID provided - check if it already exists
      const existing = db.prepare('SELECT id FROM members WHERE id = ?').get(member.id)
      if (existing) {
        throw new Error('ID_ALREADY_EXISTS')
      }
      memberId = String(member.id)
    } else {
      // Generate a unique encrypted ID
      memberId = generateEncryptedId()
      let existing = db.prepare('SELECT id FROM members WHERE id = ?').get(memberId)
      while (existing) {
        memberId = generateEncryptedId()
        existing = db.prepare('SELECT id FROM members WHERE id = ?').get(memberId)
      }
    }

    const stmt = db.prepare(`
      INSERT INTO members (id, name, email, country_code, phone, gender, address, join_date, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    stmt.run(
      memberId,
      snake.name,
      snake.email || null,
      snake.country_code || '+20',
      snake.phone,
      snake.gender,
      snake.address || null,
      snake.join_date,
      snake.notes || null
    )

    return { id: memberId, ...member }
  })

  ipcMain.handle('members:update', async (_event, id: string, member) => {
    const db = getDatabase()
    const snake = toSnake(member)
    const stmt = db.prepare(`
      UPDATE members
      SET name = ?, email = ?, country_code = ?, phone = ?, gender = ?, address = ?, notes = ?
      WHERE id = ?
    `)
    stmt.run(
      snake.name,
      snake.email || null,
      snake.country_code || '+20',
      snake.phone,
      snake.gender,
      snake.address || null,
      snake.notes || null,
      id
    )

    return { id, ...member }
  })

  ipcMain.handle('members:updateId', async (_event, currentId: number, newId: number) => {
    const db = getDatabase()

    // Check if the new ID already exists
    const existing = db.prepare('SELECT id FROM members WHERE id = ?').get(newId)

    if (existing) {
      throw new Error('ID_ALREADY_EXISTS')
    }

    // Update the member's ID - foreign keys with ON UPDATE CASCADE will handle related records
    db.prepare('UPDATE members SET id = ? WHERE id = ?').run(newId, currentId)

    return { success: true, newId }
  })

  ipcMain.handle('members:delete', async (_event, id: string) => {
    const db = getDatabase()
    db.prepare('DELETE FROM members WHERE id = ?').run(id)
    return { success: true }
  })
  ipcMain.handle('members:getByPhone', async (_event, phone: string) => {
    const db = getDatabase()
    const row = db
      .prepare(
        `
      SELECT
        m.*,
        ms.id AS membership_id,
        mp.name AS plan_name,
        mp.price AS plan_price,
        ms.start_date,
        ms.end_date,
        ms.remaining_check_ins,
        ms.is_paused,
        ms.pause_duration_days,
        (
          SELECT COUNT(*) FROM memberships WHERE member_id = m.id
        ) AS membership_count
      FROM members m
      LEFT JOIN memberships ms ON m.id = ms.member_id
        AND ms.end_date >= date('now')
      LEFT JOIN membership_plans mp ON ms.plan_id = mp.id
      WHERE m.phone = ?
      `
      )
      .get(phone) as MemberDbRow | undefined

    if (!row) return null

    let status: 'active' | 'inactive' | 'expired' | 'paused' = 'inactive'
    const today = new Date().toISOString().split('T')[0]
    if (row.membership_id && row.end_date && row.end_date >= today) {
      if (row.is_paused === 1) {
        status = 'paused'
      } else {
        status = 'active'
      }
    } else if (row.membership_count > 0) {
      status = 'expired'
    }

    return {
      id: row.id,
      name: row.name,
      email: row.email,
      countryCode: row.country_code,
      phone: row.phone,
      gender: row.gender,
      address: row.address,
      joinDate: row.join_date,
      notes: row.notes,
      createdAt: row.created_at,
      status,
      currentMembership: row.membership_id
        ? {
            id: row.membership_id,
            planName: row.plan_name!,
            planPrice: row.plan_price!,
            startDate: row.start_date!,
            endDate: row.end_date!,
            remainingCheckIns: row.remaining_check_ins,
            isPaused: row.is_paused === 1
          }
        : undefined
    }
  })
}

ipcMain.handle('members:search', async (_event, query: string, page: number = 1) => {
  const db = getDatabase()
  const limit = 10
  const offset = (page - 1) * limit

  const search = `%${query.trim()}%`

  const rows = db
    .prepare(
      `
    SELECT
      m.id,
      m.name,
      m.country_code,
      m.phone,
      m.email,
      ms.end_date,
      ms.is_paused
    FROM members m
    LEFT JOIN memberships ms ON m.id = ms.member_id
      AND ms.end_date >= date('now')
    WHERE m.name LIKE ? OR (REPLACE(m.country_code, '+', '') || m.phone) LIKE ? OR CAST(m.id AS TEXT) LIKE ?
    ORDER BY m.name ASC
    LIMIT ? OFFSET ?
  `
    )
    .all(search, search, search, limit, offset)

  const today = new Date().toISOString().split('T')[0]

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return rows.map((row: any) => ({
    id: row.id,
    name: row.name,
    countryCode: row.country_code,
    phone: row.phone,
    email: row.email,
    membershipStatus:
      row.end_date && row.end_date >= today
        ? row.is_paused === 1
          ? 'paused'
          : 'active'
        : 'inactive'
  }))
})
