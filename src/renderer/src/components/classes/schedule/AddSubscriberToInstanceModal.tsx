import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Search, UserPlus } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@renderer/components/ui/dialog'
import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'
import { Label } from '@renderer/components/ui/label'
import type { ClassInstance, ClassPlanType, ClassSubscriberFormData } from '@renderer/models/classRule'
import { CLASS_PLAN_TYPES } from '@renderer/models/classRule'
import type { Member } from '@renderer/models/member'

interface AddSubscriberToInstanceModalProps {
  instance: ClassInstance
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

interface FoundMember {
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

export default function AddSubscriberToInstanceModal({
  instance,
  open,
  onClose,
  onSuccess
}: AddSubscriberToInstanceModalProps) {
  const { t } = useTranslation('classes')

  const prices: Prices = {
    pricePerClass: instance.pricePerClass,
    pricePerWeek: instance.pricePerWeek,
    pricePerMonth: instance.pricePerMonth,
    pricePerYear: instance.pricePerYear
  }

  const availablePlans = CLASS_PLAN_TYPES.filter(
    (pt) => getPlanPrice(prices, pt) !== null && (getPlanPrice(prices, pt) ?? 0) > 0
  )

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<FoundMember[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedMember, setSelectedMember] = useState<FoundMember | null>(null)
  const [planType, setPlanType] = useState<ClassPlanType>(availablePlans[0] ?? 'per_class')
  const [amountPaid, setAmountPaid] = useState(0)
  const [isPartial, setIsPartial] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const debouncedQuery = useDebounce(query, 300)

  useEffect(() => {
    if (!debouncedQuery.trim()) { setResults([]); setShowDropdown(false); return }
    window.electron.ipcRenderer
      .invoke('members:get', 1, {
        query: debouncedQuery, status: 'all', gender: 'all', dateFrom: '', dateTo: ''
      })
      .then((data: { members: Member[] }) => {
        setResults(
          (data.members ?? []).map((m) => ({
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

  const handleSelectMember = (member: FoundMember) => {
    setSelectedMember(member)
    setQuery(member.name)
    setShowDropdown(false)
    const firstPlan = availablePlans[0] ?? 'per_class'
    setPlanType(firstPlan)
    setAmountPaid(getPlanPrice(prices, firstPlan) ?? 0)
    setIsPartial(false)
  }

  const handlePlanChange = (pt: ClassPlanType) => {
    setPlanType(pt)
    setAmountPaid(getPlanPrice(prices, pt) ?? 0)
    setIsPartial(false)
  }

  const handlePartialChange = (checked: boolean) => {
    setIsPartial(checked)
    if (!checked) setAmountPaid(getPlanPrice(prices, planType) ?? 0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedMember || availablePlans.length === 0) return
    const amount = getPlanPrice(prices, planType) ?? 0

    const payload: ClassSubscriberFormData = {
      memberId: selectedMember.id,
      planType,
      amount,
      amountPaid: isPartial ? amountPaid : amount,
      isPartialPayment: isPartial
    }

    setSubmitting(true)
    try {
      const result = await window.electron.ipcRenderer.invoke(
        'classes:addSubscriberToInstance',
        instance.id,
        payload
      )
      if (result.success) {
        toast.success(t('subscriberForm.add'))
        handleClose()
        onSuccess()
      } else {
        toast.error(t('errors.saveFailed'))
      }
    } catch {
      toast.error(t('errors.saveFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    setQuery('')
    setResults([])
    setShowDropdown(false)
    setSelectedMember(null)
    setPlanType(availablePlans[0] ?? 'per_class')
    setAmountPaid(0)
    setIsPartial(false)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {t('subscriberForm.title')} — {instance.name}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div ref={containerRef} className="relative">
            <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <Input
              value={query}
              onChange={(e) => { setQuery(e.target.value); if (!e.target.value) setSelectedMember(null) }}
              onFocus={() => query && setShowDropdown(true)}
              placeholder={t('rules.form.subscriberSearch')}
              className="bg-gray-800 ps-10 border-gray-700"
            />
            {showDropdown && results.length > 0 && (
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

          {selectedMember && availablePlans.length > 0 && (
            <div className="space-y-3 rounded-lg border border-gray-700 bg-gray-800 p-3">
              <p className="text-sm font-medium text-white">{selectedMember.name}</p>

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
                        planType === pt
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
                  value={getPlanPrice(prices, planType) ?? 0}
                  readOnly
                  className="bg-gray-900 border-gray-700 text-sm h-8 opacity-60 cursor-not-allowed"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="modal-partial"
                  checked={isPartial}
                  onChange={(e) => handlePartialChange(e.target.checked)}
                  className="rounded"
                />
                <Label htmlFor="modal-partial" className="cursor-pointer text-xs text-gray-300">
                  {t('subscriberForm.partial')}
                </Label>
              </div>

              {isPartial && (
                <div className="space-y-1">
                  <Label className="text-xs text-gray-400">{t('subscriberForm.amountPaid')}</Label>
                  <Input
                    type="number"
                    min={0}
                    max={getPlanPrice(prices, planType) ?? 0}
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(Number(e.target.value))}
                    placeholder="0.00"
                    className="bg-gray-900 border-gray-700 text-sm h-8"
                  />
                </div>
              )}
            </div>
          )}

          {selectedMember && availablePlans.length === 0 && (
            <p className="text-xs text-amber-400 text-center py-2">{t('errors.noPricingPlan')}</p>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={handleClose} disabled={submitting}>
              {t('subscriberForm.cancel')}
            </Button>
            <Button
              type="submit"
              variant="secondary"
              disabled={submitting || !selectedMember || availablePlans.length === 0}
            >
              <UserPlus className="h-3.5 w-3.5 me-1" />
              {t('subscriberForm.add')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
