import { ipcMain } from 'electron'
import { getDatabase } from '../database'
import { Report } from '@renderer/models/report'

export function registerReportsHandlers() {
  ipcMain.handle('reports:generate', async (_event, startDate: string, endDate: string) => {
    const db = getDatabase()

    const start = new Date(startDate)
    const end = new Date(endDate)
    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1

    const prevEnd = new Date(start)
    prevEnd.setDate(prevEnd.getDate() - 1)
    const prevStart = new Date(prevEnd)
    prevStart.setDate(prevStart.getDate() - daysDiff + 1)

    const prevStartDate = prevStart.toISOString().split('T')[0]
    const prevEndDate = prevEnd.toISOString().split('T')[0]

    // ============ CURRENT PERIOD ============

    const revenueResult = db
      .prepare(
        `
      SELECT SUM(amount_paid) as total
      FROM memberships
      WHERE payment_date BETWEEN ? AND ?
    `
      )
      .get(startDate, endDate) as { total: number | null }

    const storeRevenueResult = db
      .prepare(
        `
      SELECT COALESCE(SUM(total_amount), 0) as total
      FROM store_sales
      WHERE DATE(sold_at) BETWEEN ? AND ?
    `
      )
      .get(startDate, endDate) as { total: number }

    // Total Members (all time)
    const totalMembersResult = db.prepare('SELECT COUNT(*) as count FROM members').get() as {
      count: number
    }

    // New Members in period
    const newMembersResult = db
      .prepare(
        `
      SELECT COUNT(*) as count
      FROM members
      WHERE join_date BETWEEN ? AND ?
    `
      )
      .get(startDate, endDate) as { count: number }

    // Total Memberships (all time)
    const totalMembershipsResult = db
      .prepare('SELECT COUNT(*) as count FROM memberships')
      .get() as { count: number }

    // New Memberships in period
    const newMembershipsResult = db
      .prepare(
        `
      SELECT COUNT(*) as count
      FROM memberships
      WHERE start_date BETWEEN ? AND ?
    `
      )
      .get(startDate, endDate) as { count: number }

    // Renewed Memberships (memberships for existing members)
    const renewedMembershipsResult = db
      .prepare(
        `
      SELECT COUNT(*) as count
      FROM memberships
      WHERE start_date BETWEEN ? AND ?
      AND member_id IN (
        SELECT member_id FROM memberships
        WHERE start_date < ?
      )
    `
      )
      .get(startDate, endDate, startDate) as { count: number }

    // Total Check-ins
    const checkInsResult = db
      .prepare(
        `
      SELECT COUNT(*) as count
      FROM check_ins
      WHERE DATE(check_in_time) BETWEEN ? AND ?
    `
      )
      .get(startDate, endDate) as { count: number }

    // Active Members (members with valid membership)
    const activeMembersResult = db
      .prepare(
        `
      SELECT COUNT(DISTINCT member_id) as count
      FROM memberships
      WHERE end_date >= ?
    `
      )
      .get(endDate) as { count: number }

    // Billing income transactions in period
    const billingIncomeResult = db
      .prepare(
        `
      SELECT COALESCE(SUM(amount), 0) as total
      FROM transactions
      WHERE type = 'income' AND date BETWEEN ? AND ?
    `
      )
      .get(startDate, endDate) as { total: number }

    // ============ PREVIOUS PERIOD ============

    // Previous Revenue
    const prevRevenueResult = db
      .prepare(
        `
      SELECT SUM(amount_paid) as total
      FROM memberships
      WHERE payment_date BETWEEN ? AND ?
    `
      )
      .get(prevStartDate, prevEndDate) as { total: number | null }

    const prevStoreRevenueResult = db
      .prepare(
        `
      SELECT COALESCE(SUM(total_amount), 0) as total
      FROM store_sales
      WHERE DATE(sold_at) BETWEEN ? AND ?
    `
      )
      .get(prevStartDate, prevEndDate) as { total: number }

    // Previous New Members
    const prevNewMembersResult = db
      .prepare(
        `
      SELECT COUNT(*) as count
      FROM members
      WHERE join_date BETWEEN ? AND ?
    `
      )
      .get(prevStartDate, prevEndDate) as { count: number }

    // Previous New Memberships
    const prevNewMembershipsResult = db
      .prepare(
        `
      SELECT COUNT(*) as count
      FROM memberships
      WHERE start_date BETWEEN ? AND ?
    `
      )
      .get(prevStartDate, prevEndDate) as { count: number }

    // Previous billing income
    const prevBillingIncomeResult = db
      .prepare(
        `
      SELECT COALESCE(SUM(amount), 0) as total
      FROM transactions
      WHERE type = 'income' AND date BETWEEN ? AND ?
    `
      )
      .get(prevStartDate, prevEndDate) as { total: number }

    // Previous Check-ins
    const prevCheckInsResult = db
      .prepare(
        `
      SELECT COUNT(*) as count
      FROM check_ins
      WHERE DATE(check_in_time) BETWEEN ? AND ?
    `
      )
      .get(prevStartDate, prevEndDate) as { count: number }

    // Revenue by Day — stacked: memberships + store + billing (pre-aggregated to avoid cross-join)
    const revenueByDay = db
      .prepare(
        `
      WITH RECURSIVE dates(date) AS (
        SELECT ?
        UNION ALL
        SELECT DATE(date, '+1 day')
        FROM dates
        WHERE date < ?
      ),
      m_agg AS (
        SELECT DATE(payment_date) as d, SUM(amount_paid) as total
        FROM memberships
        GROUP BY DATE(payment_date)
      ),
      s_agg AS (
        SELECT DATE(sold_at) as d, SUM(total_amount) as total
        FROM store_sales
        GROUP BY DATE(sold_at)
      ),
      b_agg AS (
        SELECT date as d,
          SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END) as total
        FROM transactions
        GROUP BY date
      )
      SELECT
        dates.date,
        COALESCE(m_agg.total, 0) AS memberships,
        COALESCE(s_agg.total, 0) AS store,
        COALESCE(m_agg.total, 0) + COALESCE(s_agg.total, 0) + COALESCE(b_agg.total, 0) AS revenue
      FROM dates
      LEFT JOIN m_agg ON m_agg.d = dates.date
      LEFT JOIN s_agg ON s_agg.d = dates.date
      LEFT JOIN b_agg ON b_agg.d = dates.date
      ORDER BY dates.date ASC
    `
      )
      .all(startDate, endDate) as Array<{
        date: string
        memberships: number
        store: number
        revenue: number
      }>

    // Check-ins by Day
    const checkInsByDay = db
      .prepare(
        `
      SELECT 
        DATE(check_in_time) as date,
        COUNT(*) as count
      FROM check_ins
      WHERE DATE(check_in_time) BETWEEN ? AND ?
      GROUP BY DATE(check_in_time)
      ORDER BY date ASC
    `
      )
      .all(startDate, endDate) as Array<{ date: string; count: number }>

    const membershipRevenue = revenueResult.total || 0
    const storeRevenue = storeRevenueResult.total
    const billingIncome = billingIncomeResult.total
    const totalRevenue = membershipRevenue + storeRevenue + billingIncome

    const prevMembershipRevenue = prevRevenueResult.total || 0
    const prevStoreRevenue = prevStoreRevenueResult.total
    const prevBillingIncome = prevBillingIncomeResult.total
    const prevTotalRevenue = prevMembershipRevenue + prevStoreRevenue + prevBillingIncome

    const revenueChange =
      prevTotalRevenue > 0 ? ((totalRevenue - prevTotalRevenue) / prevTotalRevenue) * 100 : 0

    const newMembers = newMembersResult.count
    const prevNewMembers = prevNewMembersResult.count
    const membersChange =
      prevNewMembers > 0 ? ((newMembers - prevNewMembers) / prevNewMembers) * 100 : 0

    const newMemberships = newMembershipsResult.count
    const prevNewMemberships = prevNewMembershipsResult.count
    const membershipsChange =
      prevNewMemberships > 0
        ? ((newMemberships - prevNewMemberships) / prevNewMemberships) * 100
        : 0

    const checkIns = checkInsResult.count
    const prevCheckIns = prevCheckInsResult.count
    const checkInsChange = prevCheckIns > 0 ? ((checkIns - prevCheckIns) / prevCheckIns) * 100 : 0

    return {
      summary: {
        totalRevenue,
        membershipRevenue,
        storeRevenue,
        totalMembers: totalMembersResult.count,
        newMembers,
        totalMemberships: totalMembershipsResult.count,
        newMemberships,
        renewedMemberships: renewedMembershipsResult.count,
        totalCheckIns: checkIns,
        activeMembers: activeMembersResult.count,
        averageDailyRevenue: daysDiff > 0 ? totalRevenue / daysDiff : 0,
        averageDailyCheckIns: daysDiff > 0 ? checkIns / daysDiff : 0
      },
      comparison: {
        revenue: {
          current: totalRevenue,
          previous: prevTotalRevenue,
          change: revenueChange,
          difference: totalRevenue - prevTotalRevenue
        },
        members: {
          current: newMembers,
          previous: prevNewMembers,
          change: membersChange,
          difference: newMembers - prevNewMembers
        },
        memberships: {
          current: newMemberships,
          previous: prevNewMemberships,
          change: membershipsChange,
          difference: newMemberships - prevNewMemberships
        },
        checkIns: {
          current: checkIns,
          previous: prevCheckIns,
          change: checkInsChange,
          difference: checkIns - prevCheckIns
        }
      },
      revenueByDay,
      checkInsByDay,
      periodDays: daysDiff,
      previousPeriod: {
        startDate: prevStartDate,
        endDate: prevEndDate
      }
    }
  })

  ipcMain.handle('reports:save', async (_event, report: Report) => {
    const db = getDatabase()

    const id = `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    db.prepare(
      `
      INSERT INTO reports (
        id, report_type, start_date, end_date, total_revenue, store_revenue,
        total_members, new_members, total_memberships, new_memberships,
        total_check_ins, generated_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
    ).run(
      id,
      report.reportType,
      report.startDate,
      report.endDate,
      report.totalRevenue,
      report.storeRevenue ?? 0,
      report.totalMembers,
      report.newMembers,
      report.totalMemberships,
      report.newMemberships,
      report.totalCheckIns,
      report.generatedBy || 'System'
    )

    return { id }
  })

  ipcMain.handle('reports:getHistory', async (_event, page: number = 1) => {
    const db = getDatabase()
    const limit = 10
    const offset = (page - 1) * limit

    const countResult = db.prepare('SELECT COUNT(*) as total FROM reports').get() as {
      total: number
    }

    const reports = db
      .prepare(
        `
      SELECT *
      FROM reports
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `
      )
      .all(limit, offset)

    return {
      data: reports,
      page,
      totalPages: Math.ceil(countResult.total / limit)
    }
  })

  ipcMain.handle('reports:delete', async (_event, id: string) => {
    const db = getDatabase()
    db.prepare('DELETE FROM reports WHERE id = ?').run(id)
    return { success: true }
  })
}
