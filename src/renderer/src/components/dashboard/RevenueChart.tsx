import { memo, useMemo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import { TrendingUp, TrendingDown, DollarSign, Calendar, ShoppingCart, Users } from 'lucide-react'
import { useSettings } from '@renderer/hooks/useSettings'

interface DailyRevenueEntry {
  date: string
  memberships: number
  store: number
}

interface RevenueData {
  dailyRevenue: DailyRevenueEntry[]
  summary: {
    totalThisMonth: number
    totalLastMonth: number
    thisMonthMemberships: number
    thisMonthStore: number
    percentageChange: number
    averageDaily: number
    highestDay: { date: string; memberships: number; store: number }
  }
}

interface RevenueChartProps {
  data: RevenueData
}

interface TooltipPayloadEntry {
  name: string
  value: number
  color: string
}

interface CustomTooltipProps {
  active?: boolean
  payload?: TooltipPayloadEntry[]
  label?: string
  formatCurrency: (v: number) => string
  membershipLabel: string
  storeLabel: string
}

function CustomTooltip({ active, payload, label, formatCurrency, membershipLabel, storeLabel }: CustomTooltipProps) {
  if (!active || !payload?.length) return null

  const memberships = payload.find((p) => p.name === 'memberships')?.value ?? 0
  const store = payload.find((p) => p.name === 'store')?.value ?? 0

  return (
    <div className="rounded-lg border border-gray-700 bg-gray-800 p-3 text-sm shadow-xl">
      <p className="mb-2 font-medium text-gray-300">{label}</p>
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-6">
          <span className="flex items-center gap-1.5 text-yellow-400">
            <span className="h-2 w-2 rounded-full bg-yellow-400" />
            {membershipLabel}
          </span>
          <span className="font-semibold text-white">{formatCurrency(memberships)}</span>
        </div>
        <div className="flex items-center justify-between gap-6">
          <span className="flex items-center gap-1.5 text-teal-400">
            <span className="h-2 w-2 rounded-full bg-teal-400" />
            {storeLabel}
          </span>
          <span className="font-semibold text-white">{formatCurrency(store)}</span>
        </div>
        <div className="mt-1.5 border-t border-gray-700 pt-1.5 flex items-center justify-between">
          <span className="text-gray-400">Total</span>
          <span className="font-bold text-white">{formatCurrency(memberships + store)}</span>
        </div>
      </div>
    </div>
  )
}

function RevenueChart({ data }: RevenueChartProps) {
  const { t } = useTranslation('dashboard')
  const { settings } = useSettings()

  const formatCurrency = useCallback(
    (value: number) =>
      new Intl.NumberFormat(settings?.language, {
        style: 'currency',
        currency: settings?.currency,
        minimumFractionDigits: 0
      }).format(value),
    [settings?.language, settings?.currency]
  )

  const chartData = useMemo(
    () =>
      data.dailyRevenue.map((item) => ({
        date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        memberships: item.memberships,
        store: item.store
      })),
    [data.dailyRevenue]
  )

  const membershipLabel = t('revenueChart.memberships')
  const storeLabel = t('revenueChart.store')

  const highestDayTotal =
    data.summary.highestDay.memberships + data.summary.highestDay.store

  return (
    <div className="rounded-lg border border-gray-700 bg-gray-800 p-6">
      <div className="mb-6">
        <h2 className="mb-1 text-xl font-semibold text-white">{t('revenueChart.title')}</h2>
        <p className="text-sm text-gray-400">{t('revenueChart.subtitle')}</p>
      </div>

      {/* Stacked area chart */}
      <div className="mb-6">
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="gradMemberships" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.5} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="gradStore" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2dd4bf" stopOpacity={0.5} />
                <stop offset="95%" stopColor="#2dd4bf" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="date" stroke="#9ca3af" style={{ fontSize: '11px' }} />
            <YAxis
              stroke="#9ca3af"
              style={{ fontSize: '11px' }}
              tickFormatter={(v) => `${v}`}
              width={50}
            />
            <Tooltip
              content={
                <CustomTooltip
                  formatCurrency={formatCurrency}
                  membershipLabel={membershipLabel}
                  storeLabel={storeLabel}
                />
              }
            />
            <Legend
              formatter={(value) =>
                value === 'memberships' ? membershipLabel : storeLabel
              }
              wrapperStyle={{ fontSize: '12px', color: '#9ca3af', paddingTop: '12px' }}
            />
            <Area
              type="monotone"
              dataKey="memberships"
              stackId="revenue"
              stroke="#f59e0b"
              strokeWidth={2}
              fill="url(#gradMemberships)"
            />
            <Area
              type="monotone"
              dataKey="store"
              stackId="revenue"
              stroke="#2dd4bf"
              strokeWidth={2}
              fill="url(#gradStore)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        {/* This month — with breakdown */}
        <div className="rounded-lg border border-gray-700 bg-gray-900/50 p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm text-gray-400">{t('revenueChart.thisMonth')}</span>
            <DollarSign className="h-4 w-4 text-green-400" />
          </div>
          <p className="text-2xl font-bold text-white">
            {formatCurrency(data.summary.totalThisMonth)}
          </p>
          <div className="mt-2 flex items-center gap-1">
            {data.summary.percentageChange >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-400" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-400" />
            )}
            <span
              className={`text-sm ${data.summary.percentageChange >= 0 ? 'text-green-400' : 'text-red-400'}`}
            >
              {data.summary.percentageChange >= 0 ? '+' : ''}
              {data.summary.percentageChange}%
            </span>
          </div>
          <div className="mt-3 space-y-1 border-t border-gray-700 pt-2">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1 text-yellow-400">
                <Users className="h-3 w-3" />
                {membershipLabel}
              </span>
              <span className="text-gray-300">
                {formatCurrency(data.summary.thisMonthMemberships)}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1 text-teal-400">
                <ShoppingCart className="h-3 w-3" />
                {storeLabel}
              </span>
              <span className="text-gray-300">
                {formatCurrency(data.summary.thisMonthStore)}
              </span>
            </div>
          </div>
        </div>

        {/* Last month */}
        <div className="rounded-lg border border-gray-700 bg-gray-900/50 p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm text-gray-400">{t('revenueChart.lastMonth')}</span>
            <DollarSign className="h-4 w-4 text-gray-400" />
          </div>
          <p className="text-2xl font-bold text-white">
            {formatCurrency(data.summary.totalLastMonth)}
          </p>
        </div>

        {/* Avg/day */}
        <div className="rounded-lg border border-gray-700 bg-gray-900/50 p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm text-gray-400">{t('revenueChart.avgDaily')}</span>
            <DollarSign className="h-4 w-4 text-yellow-400" />
          </div>
          <p className="text-2xl font-bold text-white">
            {formatCurrency(data.summary.averageDaily)}
          </p>
        </div>

        {/* Highest day */}
        <div className="rounded-lg border border-gray-700 bg-gray-900/50 p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm text-gray-400">{t('revenueChart.highestDay')}</span>
            <Calendar className="h-4 w-4 text-orange-400" />
          </div>
          <p className="text-2xl font-bold text-white">{formatCurrency(highestDayTotal)}</p>
          {data.summary.highestDay.date && (
            <p className="mt-1 text-xs text-gray-500">
              {new Date(data.summary.highestDay.date).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default memo(RevenueChart)
