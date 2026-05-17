import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Search, X, UserPlus } from 'lucide-react'
import { Input } from '@renderer/components/ui/input'
import { Button } from '@renderer/components/ui/button'
import { Label } from '@renderer/components/ui/label'
import type { Member } from '@renderer/models/member'
import type { ClassPlanType, ClassSubscriberFormData } from '@renderer/models/classRule'
import { CLASS_PLAN_TYPES } from '@renderer/models/classRule'

interface Prices {
  pricePerClass: number | null
  pricePerWeek: number | null
  pricePerMonth: number | null
  pricePerYear: number | null
}

interface InstanceSubscriberSearchProps extends Prices {
  subscribers: ClassSubscriberFormData[]
  onAdd: (subscriber: ClassSubscriberFormData) => void
  onRemove: (memberId: string) => void
}

interface MemberSearchResult {
  id: string
  name: string
  phone: string
  countryCode: string
}

function getPlanPrice(prices: Prices, pt: ClassPlanType): number | null {
  const map: Record<ClassPlanType, keyof Prices> = {
    per_class: 'pricePerClass',
    per_week: 'pricePerWeek',
    per_month: 'pricePerMonth',
    per_year: 'pricePerYear'
  }
  return prices[map[pt]]
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}

export default function InstanceSubscriberSearch({
  subscribers,
  onAdd,
  onRemove,
  pricePerClass,
  pricePerWeek,
  pricePerMonth,
  pricePerYear
}: InstanceSubscriberSearchProps) {
  const { t } = useTranslation('classes')
  const prices: Prices = { pricePerClass, pricePerWeek, pricePerMonth, pricePerYear }
  const availablePlans = CLASS_PLAN_TYPES.filter(
    (pt) => getPlanPrice(prices, pt) !== null && getPlanPrice(prices, pt)! > 0
  )

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<MemberSearchResult[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [selected, setSelected] = useState<MemberSearchResult | null>(null)
  const [plan, setPlan] = useState<ClassPlanType>(availablePlans[0] ?? 'per_class')
  const [amountPaid, setAmountPaid] = useState(0)
  const [isPartial, setIsPartial] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const debouncedQuery = useDebounce(query, 300)

  const enrolledIds = new Set(subscribers.map((s) => s.memberId))

  useEffect(() => {
    if (!debouncedQuery.trim()) { setResults([]); setShowDropdown(false); return }
    window.electron.ipcRenderer
      .invoke('members:get', 1, {
        query: debouncedQuery,
        status: 'all',
        gender: 'all',
        dateFrom: '',
        dateTo: ''
      })
      .then((data: { members: Member[] }) => {
        setResults(
          (data.members ?? [])
            .filter((m) => !enrolledIds.has(m.id ?? ''))
            .map((m) => ({
              id: m.id as string,
              name: m.name,
              phone: m.phone,
              countryCode: m.countryCode
            }))
        )
        setShowDropdown(true)
      })
      .catch(() => setResults([]))
  }, [debouncedQuery])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSelectMember = (member: MemberSearchResult) => {
    setSelected(member)
    setQuery(member.name)
    setResults([])
    setShowDropdown(false)
    const firstPlan = availablePlans[0] ?? 'per_class'
    setPlan(firstPlan)
    setAmountPaid(getPlanPrice(prices, firstPlan) ?? 0)
    setIsPartial(false)
  }

  const handlePlanChange = (pt: ClassPlanType) => {
    setPlan(pt)
    setAmountPaid(getPlanPrice(prices, pt) ?? 0)
    setIsPartial(false)
  }

  const handlePartialChange = (checked: boolean) => {
    setIsPartial(checked)
    if (!checked) setAmountPaid(getPlanPrice(prices, plan) ?? 0)
  }

  const handleAdd = () => {
    if (!selected) return
    const amount = getPlanPrice(prices, plan) ?? 0
    onAdd({
      memberId: selected.id,
      memberName: selected.name,
      memberPhone: selected.phone,
      memberCountryCode: selected.countryCode,
      planType: plan,
      amount,
      amountPaid: isPartial ? amountPaid : amount,
      isPartialPayment: isPartial
    })
    setSelected(null)
    setQuery('')
    setShowDropdown(false)
    setPlan(availablePlans[0] ?? 'per_class')
    setAmountPaid(0)
    setIsPartial(false)
  }

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium text-gray-200">{t('rules.form.subscribers')}</Label>

      <div ref={containerRef} className="relative">
        <div className="relative">
          <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <Input
            placeholder={t('rules.form.subscriberSearch')}
            value={query}
            onChange={(e) => { setQuery(e.target.value); if (!e.target.value) setSelected(null) }}
            onFocus={() => query && setShowDropdown(true)}
            className="bg-gray-900 ps-10 border-gray-700"
          />
        </div>
        {results.length > 0 && showDropdown && (
          <div className="absolute z-10 mt-1 w-full rounded-lg border border-gray-700 bg-gray-800 shadow-lg max-h-48 overflow-y-auto">
            {results.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => handleSelectMember(m)}
                className="flex w-full items-center gap-2 px-3 py-2 text-start text-sm hover:bg-gray-700"
              >
                <span className="font-medium text-white">{m.name}</span>
                <span className="text-gray-400 text-xs" dir="ltr">{m.countryCode}{m.phone}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {selected && availablePlans.length > 0 && (
        <div className="space-y-3 rounded-lg border border-gray-700 bg-gray-900 p-3">
          <p className="text-sm font-medium text-white">{selected.name}</p>

          <div className="space-y-1">
            <Label className="text-xs text-gray-400">{t('subscriberForm.planType')}</Label>
            <div className="flex flex-wrap gap-2">
              {availablePlans.map((pt) => (
                <button
                  key={pt}
                  type="button"
                  onClick={() => handlePlanChange(pt)}
                  className={[
                    'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                    plan === pt
                      ? 'bg-yellow-500 text-gray-900'
                      : 'border border-gray-600 text-gray-400 hover:border-gray-400'
                  ].join(' ')}
                >
                  {t(`subscribers.planType.${pt}`)} — {getPlanPrice(prices, pt)}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-gray-400">{t('subscriberForm.amount')}</Label>
            <Input
              type="number"
              value={getPlanPrice(prices, plan) ?? 0}
              readOnly
              className="bg-gray-900 border-gray-700 text-sm h-8 opacity-60 cursor-not-allowed"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="inst-partial"
              checked={isPartial}
              onChange={(e) => handlePartialChange(e.target.checked)}
              className="rounded"
            />
            <Label htmlFor="inst-partial" className="cursor-pointer text-xs text-gray-300">
              {t('subscriberForm.partial')}
            </Label>
          </div>

          {isPartial && (
            <div className="space-y-1">
              <Label className="text-xs text-gray-400">{t('subscriberForm.amountPaid')}</Label>
              <Input
                type="number"
                min={0}
                max={getPlanPrice(prices, plan) ?? 0}
                value={amountPaid}
                onChange={(e) => setAmountPaid(Number(e.target.value))}
                className="bg-gray-900 border-gray-700 text-sm h-8"
              />
            </div>
          )}

          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={handleAdd}
            className="gap-1 w-full"
          >
            <UserPlus className="h-3.5 w-3.5" />
            {t('subscriberForm.add')}
          </Button>
        </div>
      )}

      {selected && availablePlans.length === 0 && (
        <p className="text-xs text-amber-400 text-center py-2">{t('errors.noPricingPlan')}</p>
      )}

      {subscribers.length > 0 ? (
        <ul className="space-y-1">
          {subscribers.map((sub) => (
            <li
              key={sub.memberId}
              className="flex items-center justify-between rounded-lg bg-gray-900 border border-gray-800 px-3 py-2 text-sm"
            >
              <div className="min-w-0">
                <p className="font-medium text-white truncate">
                  {sub.memberName ?? sub.memberId}
                </p>
                <p className="text-xs text-gray-500" dir="ltr">
                  {sub.memberCountryCode}{sub.memberPhone}
                  {' · '}{t(`subscribers.planType.${sub.planType}`)} · {sub.amount}
                  {sub.isPartialPayment && ` (${sub.amountPaid} ${t('subscriberForm.paid')})`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onRemove(sub.memberId)}
                className="ms-2 text-gray-500 hover:text-red-400 flex-shrink-0"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-gray-500">{t('rules.form.noSubscribers')}</p>
      )}
    </div>
  )
}
