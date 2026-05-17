import { ipcMain } from 'electron'
import { getDatabase } from '../database'
import { Membership, MembershipDbRow } from '@renderer/models/membership'
import type { ClassInstanceDbRow } from '../../renderer/src/models/classRule'

export function registerDashboardHandlers() {
  ipcMain.handle('dashboard:getRevenueData', async () => {
    const db = getDatabase()

    // Stacked daily revenue: memberships + store sales + classes, last 30 days
    const dailyRevenue = db
      .prepare(
        `
      WITH RECURSIVE dates(date) AS (
        SELECT DATE('now', '-29 days')
        UNION ALL
        SELECT DATE(date, '+1 day')
        FROM dates
        WHERE date < DATE('now')
      ),
      membership_daily AS (
        SELECT DATE(payment_date) as date, SUM(amount_paid) as total
        FROM memberships
        GROUP BY DATE(payment_date)
      ),
      store_daily AS (
        SELECT DATE(sold_at) as date, SUM(total_amount) as total
        FROM store_sales
        GROUP BY DATE(sold_at)
      ),
      classes_daily AS (
        SELECT DATE(created_at) as date, SUM(amount_paid) as total
        FROM class_subscribers
        GROUP BY DATE(created_at)
      )
      SELECT
        dates.date,
        COALESCE(md.total, 0) AS memberships,
        COALESCE(sd.total, 0) AS store,
        COALESCE(cd.total, 0) AS classes
      FROM dates
      LEFT JOIN membership_daily md ON md.date = dates.date
      LEFT JOIN store_daily sd ON sd.date = dates.date
      LEFT JOIN classes_daily cd ON cd.date = dates.date
      ORDER BY dates.date ASC
    `
      )
      .all() as { date: string; memberships: number; store: number; classes: number }[]

    const thisMonthMemberships = (
      db
        .prepare(
          `SELECT COALESCE(SUM(amount_paid), 0) as total
           FROM memberships
           WHERE strftime('%Y-%m', payment_date) = strftime('%Y-%m', 'now')`
        )
        .get() as { total: number }
    ).total

    const thisMonthStore = (
      db
        .prepare(
          `SELECT COALESCE(SUM(total_amount), 0) as total
           FROM store_sales
           WHERE strftime('%Y-%m', sold_at) = strftime('%Y-%m', 'now')`
        )
        .get() as { total: number }
    ).total

    const lastMonthMemberships = (
      db
        .prepare(
          `SELECT COALESCE(SUM(amount_paid), 0) as total
           FROM memberships
           WHERE strftime('%Y-%m', payment_date) = strftime('%Y-%m', 'now', '-1 month')`
        )
        .get() as { total: number }
    ).total

    const lastMonthStore = (
      db
        .prepare(
          `SELECT COALESCE(SUM(total_amount), 0) as total
           FROM store_sales
           WHERE strftime('%Y-%m', sold_at) = strftime('%Y-%m', 'now', '-1 month')`
        )
        .get() as { total: number }
    ).total

    const thisMonthClasses = (
      db
        .prepare(
          `SELECT COALESCE(SUM(amount_paid), 0) as total
           FROM class_subscribers
           WHERE strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')`
        )
        .get() as { total: number }
    ).total

    const lastMonthClasses = (
      db
        .prepare(
          `SELECT COALESCE(SUM(amount_paid), 0) as total
           FROM class_subscribers
           WHERE strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now', '-1 month')`
        )
        .get() as { total: number }
    ).total

    const totalThisMonth = thisMonthMemberships + thisMonthStore + thisMonthClasses
    const totalLastMonth = lastMonthMemberships + lastMonthStore + lastMonthClasses
    const percentageChange =
      totalLastMonth > 0 ? ((totalThisMonth - totalLastMonth) / totalLastMonth) * 100 : 0

    const daysInMonth = new Date().getDate()
    const averageDaily = daysInMonth > 0 ? totalThisMonth / daysInMonth : 0

    const highestDay =
      dailyRevenue.length > 0
        ? dailyRevenue.reduce((max, day) => {
            const dayTotal = day.memberships + day.store + day.classes
            const maxTotal = max.memberships + max.store + max.classes
            return dayTotal > maxTotal ? day : max
          })
        : { date: '', memberships: 0, store: 0, classes: 0 }

    return {
      dailyRevenue,
      summary: {
        totalThisMonth,
        totalLastMonth,
        thisMonthMemberships,
        thisMonthStore,
        thisMonthClasses,
        percentageChange: Math.round(percentageChange * 10) / 10,
        averageDaily: Math.round(averageDaily * 10) / 10,
        highestDay
      }
    }
  })

  ipcMain.handle('dashboard:getRecentCheckIns', async (_event, page: number = 1) => {
    const db = getDatabase()
    const limit = 5
    const offset = (page - 1) * limit

    // Get total count of check-ins
    const countResult = db.prepare('SELECT COUNT(*) AS total FROM check_ins').get() as {
      total: number
    }

    // Query recent check-ins with latest membership only
    const rows = db
      .prepare(
        `
    SELECT 
      ci.id,
      ci.member_id,
      ci.check_in_time,
      m.name AS member_name,
      m.phone AS member_phone,
      m.country_code AS member_country_code,
      ms.end_date AS membership_end_date
    FROM check_ins ci
    INNER JOIN members m ON ci.member_id = m.id
    LEFT JOIN memberships ms ON ms.id = (
      SELECT id FROM memberships
      WHERE member_id = m.id
      ORDER BY end_date DESC
      LIMIT 1
    )
    ORDER BY ci.check_in_time DESC
    LIMIT ? OFFSET ?
  `
      )
      .all(limit, offset)

    const today = new Date().toISOString().split('T')[0]

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const checkIns = rows.map((row: any) => {
      let status = 'none'
      if (row.membership_end_date) {
        status = row.membership_end_date >= today ? 'active' : 'expired'
      }

      return {
        id: row.id,
        memberId: row.member_id,
        checkInTime: row.check_in_time,
        memberName: row.member_name,
        memberPhone: row.member_phone,
        memberCountryCode: row.member_country_code,
        membershipStatus: status
      }
    })

    const totalPages = Math.ceil(countResult.total / limit)

    return {
      data: checkIns,
      page,
      totalPages
    }
  })

  ipcMain.handle('dashboard:getExpiringMemberships', async (_event, page: number = 1) => {
    const db = getDatabase()
    const limit = 5
    const offset = (page - 1) * limit

    const countResult = db
      .prepare(
        `
        SELECT COUNT(*) AS total
        FROM memberships ms
        WHERE ms.end_date >= date('now')
          AND ms.end_date <= date('now', '+7 days')
      `
      )
      .get() as { total: number }

    const rows = db
      .prepare(
        `
        SELECT 
          ms.id,
          ms.member_id,
          ms.plan_id,
          ms.start_date,
          ms.end_date,
          ms.amount_paid,
          ms.payment_method,
          ms.payment_date,
          ms.notes,
          ms.created_at,

          m.name AS member_name,
          m.phone AS member_phone,

          mp.name AS plan_name,
          mp.price AS plan_price,

          CAST(julianday(ms.end_date) - julianday('now') AS INTEGER) AS days_remaining
        FROM memberships ms
        INNER JOIN members m ON ms.member_id = m.id
        INNER JOIN membership_plans mp ON ms.plan_id = mp.id
        WHERE ms.end_date >= date('now')
          AND ms.end_date <= date('now', '+7 days')
        ORDER BY ms.end_date ASC
        LIMIT ? OFFSET ?
      `
      )
      .all(limit, offset) as (MembershipDbRow & { days_remaining: number })[]

    const processedMemberships: Membership[] = rows.map((row) => ({
      id: row.id,
      memberId: row.member_id,
      planId: row.plan_id,
      startDate: row.start_date,
      endDate: row.end_date,
      totalPrice: row.total_price,
      amountPaid: row.amount_paid,
      remainingBalance: row.remaining_balance,
      paymentStatus: row.payment_status,
      paymentMethod: row.payment_method,
      paymentDate: row.payment_date,
      remainingCheckIns: row.remaining_check_ins,
      isCustom: Boolean(row.is_custom),
      notes: row.notes,
      createdAt: row.created_at,

      memberName: row.member_name,
      memberPhone: row.member_phone,
      planName: row.plan_name,
      planPrice: row.plan_price,

      daysRemaining: row.days_remaining
    }))

    const totalPages = Math.ceil(countResult.total / limit)

    return {
      data: processedMemberships,
      page,
      totalPages
    }
  })

  ipcMain.handle('dashboard:getTodaysClasses', async (_event, page: number = 1) => {
    const db = getDatabase()
    const limit = 5
    const offset = (page - 1) * limit

    const d = new Date()
    const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

    const countResult = db
      .prepare('SELECT COUNT(*) AS total FROM class_instances WHERE scheduled_date = ?')
      .get(today) as { total: number }

    const rows = db
      .prepare(`
        SELECT ci.*,
          (SELECT COUNT(*) FROM class_subscribers cs WHERE cs.instance_id = ci.id) AS subscriber_count
        FROM class_instances ci
        WHERE ci.scheduled_date = ?
        ORDER BY
          CASE WHEN ci.start_time IS NULL THEN 1 ELSE 0 END,
          ci.start_time ASC,
          ci.name ASC
        LIMIT ? OFFSET ?
      `)
      .all(today, limit, offset) as (ClassInstanceDbRow & { subscriber_count: number })[]

    const instances = rows.map((row) => ({
      id: row.id,
      ruleId: row.rule_id,
      name: row.name,
      category: row.category,
      color: row.color,
      coachName: row.coach_name,
      scheduledDate: row.scheduled_date,
      dayOfWeek: row.day_of_week,
      isRecurring: Boolean(row.is_recurring),
      status: row.status,
      startTime: row.start_time,
      pricePerClass: row.price_per_class,
      pricePerWeek: row.price_per_week,
      pricePerMonth: row.price_per_month,
      pricePerYear: row.price_per_year,
      subscriberCount: row.subscriber_count,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }))

    return {
      data: instances,
      page,
      totalPages: Math.ceil(countResult.total / limit)
    }
  })
}
