import { useEffect, useState, useCallback, memo } from 'react'
import { LoaderCircle } from 'lucide-react'
import {
  WelcomeHeader,
  RevenueChart,
  RecentCheckIns,
  ExpiringMemberships,
  QuickActions
} from '@renderer/components/dashboard'
import { ViewMember } from '@renderer/components/members'
import { Member } from '@renderer/models/member'
import { QuickCheckInWidget } from '@renderer/components/checkIns'
import MemberCheckInCard from '@renderer/components/checkIns/MemberCheckInCard'
import { Membership } from '@renderer/models/membership'
import EditMembership from '@renderer/components/memberships/EditMembership'
import CreateMember from '@renderer/components/members/CreateMember'
import CreateMembership from '@renderer/components/memberships/CreateMembership'
import CreatePlan from '@renderer/components/plans/CreatePlan'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@renderer/hooks/useAuth'
import { PERMISSIONS } from '@renderer/models/account'
import { usePlanFeatures } from '@renderer/hooks/usePlanFeatures'
import { PlanGate } from '@renderer/components/ui/PlanGate'

interface RevenueData {
  dailyRevenue: { date: string; revenue: number }[]
  summary: {
    totalThisMonth: number
    totalLastMonth: number
    percentageChange: number
    averageDaily: number
    highestDay: { date: string; revenue: number }
  }
}

interface CheckIn {
  id: string
  memberId: string
  checkInTime: string
  memberName: string
  memberCountryCode: string
  memberPhone: string
  membershipStatus: 'active' | 'expired' | 'none'
}

export type ExpiringMembership = Membership & { daysRemaining: number }

function Dashboard() {
  const { t } = useTranslation('dashboard')
  const { hasPermission } = useAuth()
  const planFeatures = usePlanFeatures()
  const [loading, setLoading] = useState(true)
  const [revenueData, setRevenueData] = useState<RevenueData>({
    dailyRevenue: [],
    summary: {
      totalThisMonth: 0,
      totalLastMonth: 0,
      percentageChange: 0,
      averageDaily: 0,
      highestDay: { date: '', revenue: 0 }
    }
  })

  const [recentCheckIns, setRecentCheckIns] = useState<CheckIn[]>([])
  const [checkInsPage, setCheckInsPage] = useState(1)
  const [checkInsTotalPages, setCheckInsTotalPages] = useState(1)

  const [expiringMemberships, setExpiringMemberships] = useState<ExpiringMembership[]>([])
  const [expiringPage, setExpiringPage] = useState(1)
  const [expiringTotalPages, setExpiringTotalPages] = useState(1)

  // Dialog states
  const [viewMember, setViewMember] = useState<Member | null>(null)
  const [viewMemberCard, setViewMemberCard] = useState<Member | null>(null)
  const [editMembershipId, setEditMembershipId] = useState<string | null>(null)
  const [editMembership, setEditMembership] = useState<Membership | null>(null)

  // Create dialog states
  const [showCreateMember, setShowCreateMember] = useState(false)
  const [showCreateMembership, setShowCreateMembership] = useState(false)
  const [showCreatePlan, setShowCreatePlan] = useState(false)

  const loadCheckIns = useCallback(async (page: number) => {
    try {
      const result = await window.electron.ipcRenderer.invoke('dashboard:getRecentCheckIns', page)
      setRecentCheckIns(result.data)
      setCheckInsPage(result.page)
      setCheckInsTotalPages(result.totalPages)
    } catch (error) {
      console.error('Failed to load check-ins:', error)
    }
  }, [])

  const loadExpiringMemberships = useCallback(async (page: number) => {
    try {
      const result = await window.electron.ipcRenderer.invoke(
        'dashboard:getExpiringMemberships',
        page
      )
      setExpiringMemberships(result.data)
      setExpiringPage(result.page)
      setExpiringTotalPages(result.totalPages)
    } catch (error) {
      console.error('Failed to load expiring memberships:', error)
    }
  }, [])

  const loadDashboardData = useCallback(async () => {
    setLoading(true)
    try {
      const [revenue] = await Promise.all([
        window.electron.ipcRenderer.invoke('dashboard:getRevenueData'),
        loadCheckIns(1),
        loadExpiringMemberships(1)
      ])

      setRevenueData(revenue)
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }, [loadCheckIns, loadExpiringMemberships])

  useEffect(() => {
    loadDashboardData()
  }, [loadDashboardData])

  const handleViewMember = useCallback(async (memberId: string) => {
    try {
      const member = await window.electron.ipcRenderer.invoke('members:getById', memberId)
      setViewMember(member)
    } catch (error) {
      console.error('Failed to load member:', error)
    }
  }, [])

  const handleViewMemberCard = useCallback(async (memberId: string) => {
    try {
      const member = await window.electron.ipcRenderer.invoke('members:getById', memberId)
      setViewMemberCard(member)
    } catch (error) {
      console.error('Failed to load member:', error)
      toast.error(t('error.loadFailed'))
    }
  }, [t])

  const handleRenewMembership = useCallback(async (membershipId: string) => {
    if (!hasPermission(PERMISSIONS.memberships.extend)) {
      toast.error(t('error.noPermission'))
      return
    }

    try {
      await window.electron.ipcRenderer.invoke('memberships:extend', membershipId)
      toast.success(t('success.extendSuccess'))
    } catch (error) {
      toast.warning(t('error.extendFail'))
      console.error('Failed to load member:', error)
    }
  }, [hasPermission, t])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoaderCircle className="w-20 h-20 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <ViewMember member={viewMember} open={!!viewMember} onClose={() => setViewMember(null)} />
      {viewMemberCard && (
        <MemberCheckInCard
          member={viewMemberCard}
          open={!!viewMemberCard}
          onCancel={() => setViewMemberCard(null)}
          viewOnly={true}
        />
      )}
      <EditMembership
        membership={editMembership}
        open={!!editMembershipId}
        onClose={() => {
          setEditMembershipId(null)
          setEditMembership(null)
        }}
        onSuccess={loadDashboardData}
      />

      {/* Create dialogs controlled by Dashboard state */}
      <CreateMember
        open={showCreateMember}
        onOpenChange={setShowCreateMember}
        onSuccess={loadDashboardData}
      />
      <CreateMembership
        open={showCreateMembership}
        onOpenChange={setShowCreateMembership}
        onSuccess={loadDashboardData}
      />
      <CreatePlan
        open={showCreatePlan}
        onOpenChange={setShowCreatePlan}
        onSuccess={loadDashboardData}
      />

      <WelcomeHeader />

      {hasPermission(PERMISSIONS.checkins.create) && (
        <QuickCheckInWidget onCheckInSuccess={loadDashboardData} />
      )}

      <QuickActions
        onCreateMember={
          hasPermission(PERMISSIONS.members.create) ? () => setShowCreateMember(true) : undefined
        }
        onCreateMembership={
          hasPermission(PERMISSIONS.memberships.create)
            ? () => setShowCreateMembership(true)
            : undefined
        }
        onCreatePlan={
          hasPermission(PERMISSIONS.plans.create) ? () => setShowCreatePlan(true) : undefined
        }
      />

      {hasPermission(PERMISSIONS.dashboard.view_financial) && (
        planFeatures.financialDashboard ? (
          <RevenueChart data={revenueData} />
        ) : (
          <PlanGate requiredPlan="pro">
            <RevenueChart data={revenueData} />
          </PlanGate>
        )
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentCheckIns
          data={recentCheckIns}
          onViewMember={handleViewMember}
          onRowClick={handleViewMemberCard}
          page={checkInsPage}
          totalPages={checkInsTotalPages}
          onPageChange={loadCheckIns}
        />

        <ExpiringMemberships
          data={expiringMemberships}
          onRenew={handleRenewMembership}
          page={expiringPage}
          totalPages={expiringTotalPages}
          onPageChange={loadExpiringMemberships}
          canRenew={hasPermission(PERMISSIONS.memberships.extend)}
        />
      </div>
    </div>
  )
}

export default memo(Dashboard)
