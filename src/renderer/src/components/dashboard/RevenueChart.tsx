import { memo, useMemo, useCallback, useState } from 'react'
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
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  ShoppingCart,
  Users,
  Dumbbell,
  Wallet,
  ArrowDownCircle,
  Minus
} from 'lucide-react'
import { useSettings } from '@renderer/hooks/useSettings'

type RevenueSeriesFilter = 'all' | 'memberships' | 'store' | 'classes' | 'income'

interface DailyRevenueEntry {
  date: string
  memberships: number
  store: number
  classes: number
  income: number
}

interface RevenueData {
  dailyRevenue: DailyRevenueEntry[]
  summary: {
    totalThisMonth: number
    totalLastMonth: number
    thisMonthMemberships: number
    thisMonthStore: number
    thisMonthClasses: number
    thisMonthIncome: number
    thisMonthExpenses: number
    lastMonthExpenses: number
    percentageChange: number
    averageDaily: number
    highestDay: { date: string; memberships: number; store: number; classes: number; income: number }
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
  classesLabel: string
  incomeLabel: string
}

function CustomTooltip({
  active,
  payload,
  label,
  formatCurrency,
  membershipLabel,
  storeLabel,
  classesLabel,
  incomeLabel
}: CustomTooltipProps) {
  if (!active || !payload?.length) return null

  const memberships = payload.find((p) => p.name === 'memberships')?.value ?? 0
  const store = payload.find((p) => p.name === 'store')?.value ?? 0
  const classes = payload.find((p) => p.name === 'classes')?.value ?? 0
  const income = payload.find((p) => p.name === 'income')?.value ?? 0
  const total = payload.reduce((sum, p) => sum + (p.value ?? 0), 0)

  return (
    <div className="rounded-lg border border-gray-700 bg-gray-800 p-3 text-sm shadow-xl">
      <p className="mb-2 font-medium text-gray-300">{label}</p>
      <div className="space-y-1">
        {payload.some((p) => p.name === 'memberships') && (
          <div className="flex items-center justify-between gap-6">
            <span className="flex items-center gap-1.5 text-yellow-400">
              <span className="h-2 w-2 rounded-full bg-yellow-400" />
              {membershipLabel}
            </span>
            <span className="font-semibold text-white">{formatCurrency(memberships)}</span>
          </div>
        )}
        {payload.some((p) => p.name === 'store') && (
          <div className="flex items-center justify-between gap-6">
            <span className="flex items-center gap-1.5 text-teal-400">
              <span className="h-2 w-2 rounded-full bg-teal-400" />
              {storeLabel}
            </span>
            <span className="font-semibold text-white">{formatCurrency(store)}</span>
          </div>
        )}
        {payload.some((p) => p.name === 'classes') && (
          <div className="flex items-center justify-between gap-6">
            <span className="flex items-center gap-1.5 text-indigo-400">
              <span className="h-2 w-2 rounded-full bg-indigo-400" />
              {classesLabel}
            </span>
            <span className="font-semibold text-white">{formatCurrency(classes)}</span>
          </div>
        )}
        {payload.some((p) => p.name === 'income') && (
          <div className="flex items-center justify-between gap-6">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              {incomeLabel}
            </span>
            <span className="font-semibold text-white">{formatCurrency(income)}</span>
          </div>
        )}
        {payload.length > 1 && (
          <div className="mt-1.5 border-t border-gray-700 pt-1.5 flex items-center justify-between">
            <span className="text-gray-400">Total</span>
            <span className="font-bold text-white">{formatCurrency(total)}</span>
          </div>
        )}
      </div>
    </div>
  )
}

function RevenueChart({ data }: RevenueChartProps) {
  const { t } = useTranslation('dashboard')
  const { settings } = useSettings()
  const [seriesFilter, setSeriesFilter] = useState<RevenueSeriesFilter>('all')

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
        memberships: item.memberships ?? 0,
        store: item.store ?? 0,
        classes: item.classes ?? 0,
        income: item.income ?? 0
      })),
    [data.dailyRevenue]
  )

  const membershipLabel = t('revenueChart.memberships')
  const storeLabel = t('revenueChart.store')
  const classesLabel = t('revenueChart.classes')
  const incomeLabel = t('revenueChart.income')

  const showMemberships = seriesFilter === 'all' || seriesFilter === 'memberships'
  const showStore = seriesFilter === 'all' || seriesFilter === 'store'
  const showClasses = seriesFilter === 'all' || seriesFilter === 'classes'
  const showIncome = seriesFilter === 'all' || seriesFilter === 'income'

  const highestDayTotal =
    (data.summary.highestDay.memberships ?? 0) +
    (data.summary.highestDay.store ?? 0) +
    (data.summary.highestDay.classes ?? 0) +
    (data.summary.highestDay.income ?? 0)

  const filterButtons: {
    key: RevenueSeriesFilter
    label: string
    activeClass: string
  }[] = [
    {
      key: 'all',
      label: t('revenueChart.all'),
      activeClass: 'bg-gray-600 border-gray-500 text-white'
    },
    {
      key: 'memberships',
      label: membershipLabel,
      activeClass: 'bg-yellow-500/20 border-yellow-500/50 text-yellow-300'
    },
    {
      key: 'store',
      label: storeLabel,
      activeClass: 'bg-teal-500/20 border-teal-500/50 text-teal-300'
    },
    {
      key: 'classes',
      label: classesLabel,
      activeClass: 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300'
    },
    {
      key: 'income',
      label: incomeLabel,
      activeClass: 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
    }
  ]

  return (
    <div className="rounded-lg border border-gray-700 bg-gray-800 p-6">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="mb-1 text-xl font-semibold text-white">{t('revenueChart.title')}</h2>
          <p className="text-sm text-gray-400">{t('revenueChart.subtitle')}</p>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {filterButtons.map(({ key, label, activeClass }) => (
            <button
              key={key}
              onClick={() => setSeriesFilter(key)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                seriesFilter === key
                  ? activeClass
                  : 'border-gray-600 text-gray-400 hover:border-gray-500 hover:text-gray-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

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
              <linearGradient id="gradClasses" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#818cf8" stopOpacity={0.5} />
                <stop offset="95%" stopColor="#818cf8" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="gradIncome" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#34d399" stopOpacity={0.5} />
                <stop offset="95%" stopColor="#34d399" stopOpacity={0.05} />
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
                  classesLabel={classesLabel}
                  incomeLabel={incomeLabel}
                />
              }
            />
            <Legend
              formatter={(value) => {
                if (value === 'memberships') return membershipLabel
                if (value === 'store') return storeLabel
                if (value === 'classes') return classesLabel
                return incomeLabel
              }}
              wrapperStyle={{ fontSize: '12px', color: '#9ca3af', paddingTop: '12px' }}
            />
            {showMemberships && (
              <Area
                type="monotone"
                dataKey="memberships"
                stackId="revenue"
                stroke="#f59e0b"
                strokeWidth={2}
                fill="url(#gradMemberships)"
              />
            )}
            {showStore && (
              <Area
                type="monotone"
                dataKey="store"
                stackId="revenue"
                stroke="#2dd4bf"
                strokeWidth={2}
                fill="url(#gradStore)"
              />
            )}
            {showClasses && (
              <Area
                type="monotone"
                dataKey="classes"
                stackId="revenue"
                stroke="#818cf8"
                strokeWidth={2}
                fill="url(#gradClasses)"
              />
            )}
            {showIncome && (
              <Area
                type="monotone"
                dataKey="income"
                stackId="revenue"
                stroke="#34d399"
                strokeWidth={2}
                fill="url(#gradIncome)"
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-6">
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
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1 text-indigo-400">
                <Dumbbell className="h-3 w-3" />
                {classesLabel}
              </span>
              <span className="text-gray-300">
                {formatCurrency(data.summary.thisMonthClasses ?? 0)}
              </span>
            </div>
            {(data.summary.thisMonthIncome ?? 0) > 0 && (
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1 text-emerald-400">
                  <Wallet className="h-3 w-3" />
                  {incomeLabel}
                </span>
                <span className="text-gray-300">
                  {formatCurrency(data.summary.thisMonthIncome ?? 0)}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-gray-700 bg-gray-900/50 p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm text-gray-400">{t('revenueChart.lastMonth')}</span>
            <DollarSign className="h-4 w-4 text-gray-400" />
          </div>
          <p className="text-2xl font-bold text-white">
            {formatCurrency(data.summary.totalLastMonth)}
          </p>
        </div>

        <div className="rounded-lg border border-gray-700 bg-gray-900/50 p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm text-gray-400">{t('revenueChart.avgDaily')}</span>
            <DollarSign className="h-4 w-4 text-yellow-400" />
          </div>
          <p className="text-2xl font-bold text-white">
            {formatCurrency(data.summary.averageDaily)}
          </p>
        </div>

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

        <div className="rounded-lg border border-red-900/30 bg-red-900/10 p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm text-gray-400">{t('revenueChart.expenses')}</span>
            <ArrowDownCircle className="h-4 w-4 text-red-400" />
          </div>
          <p className="text-2xl font-bold text-red-400">
            {formatCurrency(data.summary.thisMonthExpenses ?? 0)}
          </p>
        </div>

        <div className="rounded-lg border border-gray-700 bg-gray-900/50 p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm text-gray-400">{t('revenueChart.netProfit')}</span>
            <Minus className="h-4 w-4 text-gray-400" />
          </div>
          {(() => {
            const net = (data.summary.totalThisMonth ?? 0) - (data.summary.thisMonthExpenses ?? 0)
            return (
              <p className={`text-2xl font-bold ${net >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {net >= 0 ? '+' : ''}{formatCurrency(net)}
              </p>
            )
          })()}
        </div>
      </div>
    </div>
  )
}

export default memo(RevenueChart)
