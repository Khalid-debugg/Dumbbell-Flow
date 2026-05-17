import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Search, X, UserPlus } from 'lucide-react'
import { Input } from '@renderer/components/ui/input'
import { Label } from '@renderer/components/ui/label'
import { Button } from '@renderer/components/ui/button'
import { useDebounce } from '@renderer/hooks/useDebounce'
import { CLASS_PLAN_TYPES } from '@renderer/models/classRule'
import type { ClassPlanType, ClassSubscriberFormData } from '@renderer/models/classRule'

interface SearchMember {
  id: string
  name: string
  phone: string
  countryCode: string
}

interface Prices {
  pricePerClass: number | null
  pricePerWeek: number | null
  pricePerMonth: number | null
  pricePerYear: number | null
}

interface MemberSearchAddProps extends Prices {
  subscribers: ClassSubscriberFormData[]
  onAdd: (sub: ClassSubscriberFormData) => void
  onRemove: (memberId: string) => void
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

export default function MemberSearchAdd({
  subscribers, onAdd, onRemove,
  pricePerClass, pricePerWeek, pricePerMonth, pricePerYear
}: MemberSearchAddProps) {
  const { t } = useTranslation('classes')
  const prices: Prices = { pricePerClass, pricePerWeek, pricePerMonth, pricePerYear }

  const availablePlans = CLASS_PLAN_TYPES.filter((pt) => getPlanPrice(prices, pt) !== null)

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchMember[]>([])
  const [selected, setSelected] = useState<SearchMember | null>(null)
  const [plan, setPlan] = useState<ClassPlanType>(availablePlans[0] ?? 'per_class')
  const [amountPaid, setAmountPaid] = useState(0)
  const [isPartial, setIsPartial] = useState(false)
  const [showForm, setShowForm] = useState(false)

  const debouncedQuery = useDebounce(query, 300)

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return }
    try {
      const data = await window.electron.ipcRenderer.invoke('members:get', 1, {
        query: q, gender: 'all', status: 'all', dateFrom: '', dateTo: ''
      })
      setResults((data.members as SearchMember[]).slice(0, 8))
    } catch {
      setResults([])
    }
  }, [])

  useEffect(() => {
    if (!showForm) doSearch(debouncedQuery)
  }, [debouncedQuery, showForm, doSearch])

  const handleSelectMember = (member: SearchMember) => {
    setSelected(member)
    setQuery(member.name)
    setResults([])
    setShowForm(true)
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
    setShowForm(false)
    setResults([])
  }

  const alreadyAdded = new Set(subscribers.map((s) => s.memberId))

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          placeholder={t('rules.form.subscriberSearch')}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setShowForm(false)
            setSelected(null)
          }}
          className="bg-gray-900 ps-10 border-gray-700"
        />
        {results.length > 0 && !showForm && (
          <div className="absolute z-10 mt-1 w-full rounded-lg border border-gray-700 bg-gray-800 shadow-lg">
            {results.map((m) => (
              <button
                key={m.id}
                type="button"
                disabled={alreadyAdded.has(m.id)}
                onClick={() => handleSelectMember(m)}
                className="flex w-full items-center gap-2 px-3 py-2 text-start text-sm hover:bg-gray-700 disabled:opacity-40"
              >
                <span className="font-medium text-white">{m.name}</span>
                <span className="text-gray-400" dir="ltr">{m.countryCode}{m.phone}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {showForm && selected && availablePlans.length > 0 && (
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
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors
                    ${plan === pt ? 'bg-yellow-500 text-gray-900' : 'border border-gray-600 text-gray-400 hover:border-gray-400'}`}
                >
                  {t(`subscribers.planType.${pt}`)} — {getPlanPrice(prices, pt)}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="partial-pay"
              checked={isPartial}
              onChange={(e) => setIsPartial(e.target.checked)}
              className="rounded"
            />
            <Label htmlFor="partial-pay" className="cursor-pointer text-xs text-gray-300">
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
                onChange={(e) => {
                  const max = getPlanPrice(prices, plan) ?? 0
                  setAmountPaid(Math.min(Number(e.target.value), max))
                }}
                className="border-gray-700 bg-gray-800 text-sm"
              />
            </div>
          )}

          <div className="flex gap-2">
            <Button type="button" size="sm" variant="secondary" onClick={handleAdd} className="gap-1">
              <UserPlus className="h-3.5 w-3.5" />
              {t('subscriberForm.add')}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => { setShowForm(false); setQuery(''); setSelected(null) }}
            >
              {t('rules.form.cancel')}
            </Button>
          </div>
        </div>
      )}

      {subscribers.length > 0 ? (
        <ul className="space-y-1">
          {subscribers.map((sub) => (
            <li
              key={sub.memberId}
              className="flex items-center justify-between rounded-lg bg-gray-900 border border-gray-800 px-3 py-2 text-sm"
            >
              <div className="min-w-0">
                <p className="font-medium text-white truncate">{sub.memberName ?? sub.memberId}</p>
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
