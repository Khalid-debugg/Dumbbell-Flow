export type ReportType = 'week' | 'month' | 'year' | 'custom'

export interface Report {
  id?: string
  reportType: ReportType
  startDate: string
  endDate: string
  totalRevenue: number
  storeRevenue?: number
  totalMembers: number
  newMembers: number
  totalMemberships: number
  newMemberships: number
  totalCheckIns: number
  generatedBy?: string
  createdAt?: string
}

export interface ComparisonData {
  current: number
  previous: number
  change: number
  difference: number
}

export interface ReportData {
  summary: {
    totalRevenue: number
    membershipRevenue: number
    storeRevenue: number
    totalMembers: number
    newMembers: number
    totalMemberships: number
    newMemberships: number
    renewedMemberships: number
    totalCheckIns: number
    activeMembers: number
    averageDailyRevenue: number
    averageDailyCheckIns: number
  }
  comparison: {
    revenue: ComparisonData
    members: ComparisonData
    memberships: ComparisonData
    checkIns: ComparisonData
  }
  revenueByDay: Array<{
    date: string
    revenue: number
    memberships: number
    store: number
  }>
  checkInsByDay: Array<{
    date: string
    count: number
  }>
  periodDays: number
  previousPeriod: {
    startDate: string
    endDate: string
  }
}

export interface ReportFilters {
  reportType: ReportType
  startDate: string
  endDate: string
}
