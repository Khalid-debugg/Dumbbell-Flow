import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Minus, Plus, X, ShoppingCart, User } from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'
import { toast } from 'sonner'
import { PAYMENT_METHODS, type SaleCartItem, type PaymentMethod } from '@renderer/models/storeSale'

interface CartProps {
  items: SaleCartItem[]
  onUpdateQty: (productId: string, delta: number) => void
  onRemove: (productId: string) => void
  onClear: () => void
  onSaleComplete: () => void
  formatCurrency: (v: number) => string
  canCreateSale: boolean
}

interface MemberResult {
  id: string
  name: string
  phone: string
}

interface MembersGetResult {
  members: MemberResult[]
}

export default function Cart({
  items,
  onUpdateQty,
  onRemove,
  onClear,
  onSaleComplete,
  formatCurrency,
  canCreateSale
}: CartProps) {
  const { t } = useTranslation('store')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash')
  const [memberQuery, setMemberQuery] = useState('')
  const [memberResults, setMemberResults] = useState<MemberResult[]>([])
  const [selectedMember, setSelectedMember] = useState<MemberResult | null>(null)
  const [showMemberDropdown, setShowMemberDropdown] = useState(false)
  const [charging, setCharging] = useState(false)

  const total = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)

  const searchMembers = useCallback(async (q: string) => {
    if (!q.trim()) {
      setMemberResults([])
      setShowMemberDropdown(false)
      return
    }
    const result = (await window.electron.ipcRenderer.invoke(
      'members:get',
      1,
      q
    )) as MembersGetResult
    setMemberResults(result.members ?? [])
    setShowMemberDropdown(true)
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => searchMembers(memberQuery), 250)
    return () => clearTimeout(timer)
  }, [memberQuery, searchMembers])

  const handleCharge = async () => {
    if (items.length === 0) return
    setCharging(true)
    try {
      await window.electron.ipcRenderer.invoke(
        'store-sales:create',
        items,
        paymentMethod,
        selectedMember?.id ?? null,
        null
      )
      toast.success(t('pos.saleSuccess'))
      onClear()
      setSelectedMember(null)
      setMemberQuery('')
      setPaymentMethod('cash')
      onSaleComplete()
    } catch (err) {
      const message = err instanceof Error ? err.message : t('pos.saleError')
      toast.error(message)
    } finally {
      setCharging(false)
    }
  }

  return (
    <div className="flex h-full flex-col rounded-lg border border-gray-700 bg-gray-800">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-700 px-4 py-3">
        <div className="flex items-center gap-2 text-white">
          <ShoppingCart className="h-4 w-4 text-yellow-400" />
          <span className="font-semibold">{t('pos.cart.title')}</span>
          {items.length > 0 && (
            <span className="rounded-full bg-yellow-500 px-2 py-0.5 text-xs font-bold text-gray-900">
              {items.length}
            </span>
          )}
        </div>
        {items.length > 0 && (
          <button
            onClick={onClear}
            className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            {t('pos.cart.clear')}
          </button>
        )}
      </div>

      {/* Cart items */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-12 text-gray-600">
            <ShoppingCart className="h-10 w-10" />
            <p className="text-sm">{t('pos.cart.empty')}</p>
            <p className="text-xs">{t('pos.cart.emptyHint')}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <div
                key={item.productId}
                className="flex items-center gap-2 rounded-lg border border-gray-700 bg-gray-900/50 p-2"
              >
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium text-white">{item.productName}</p>
                  <p className="text-xs text-gray-400">
                    {formatCurrency(item.unitPrice)} {t('pos.cart.each')}
                  </p>
                </div>
                {/* Qty controls */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onUpdateQty(item.productId, -1)}
                    className="flex h-6 w-6 items-center justify-center rounded border border-gray-600 bg-gray-800 text-gray-300 hover:bg-gray-700"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="w-6 text-center text-sm font-semibold text-white">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => onUpdateQty(item.productId, 1)}
                    disabled={item.quantity >= item.stockQuantity}
                    className="flex h-6 w-6 items-center justify-center rounded border border-gray-600 bg-gray-800 text-gray-300 hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
                {/* Subtotal + remove */}
                <div className="flex items-center gap-1.5">
                  <span className="w-16 text-right text-sm font-bold text-yellow-400">
                    {formatCurrency(item.unitPrice * item.quantity)}
                  </span>
                  <button
                    onClick={() => onRemove(item.productId)}
                    className="text-gray-600 hover:text-red-400 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-700 px-4 py-3 space-y-3">
        {/* Member search */}
        <div className="relative">
          <div className="flex items-center gap-2 mb-1.5">
            <User className="h-3.5 w-3.5 text-gray-400" />
            <span className="text-xs text-gray-400">{t('pos.cart.member')}</span>
          </div>
          {selectedMember ? (
            <div className="flex items-center justify-between rounded-lg border border-gray-700 bg-gray-900/50 px-3 py-1.5">
              <span className="text-sm text-white">{selectedMember.name}</span>
              <button
                onClick={() => {
                  setSelectedMember(null)
                  setMemberQuery('')
                }}
                className="text-xs text-gray-500 hover:text-gray-300"
              >
                {t('pos.cart.removeMember')}
              </button>
            </div>
          ) : (
            <div className="relative">
              <Input
                value={memberQuery}
                onChange={(e) => setMemberQuery(e.target.value)}
                onFocus={() => memberResults.length > 0 && setShowMemberDropdown(true)}
                onBlur={() => setTimeout(() => setShowMemberDropdown(false), 150)}
                placeholder={t('pos.cart.searchMember')}
                className="border-gray-700 bg-gray-900/50 text-sm text-white placeholder:text-gray-600"
              />
              {showMemberDropdown && memberResults.length > 0 && (
                <div className="absolute bottom-full left-0 right-0 mb-1 max-h-40 overflow-y-auto rounded-lg border border-gray-700 bg-gray-900 shadow-xl z-10">
                  {memberResults.map((m) => (
                    <button
                      key={m.id}
                      onMouseDown={() => {
                        setSelectedMember(m)
                        setMemberQuery('')
                        setShowMemberDropdown(false)
                      }}
                      className="flex w-full flex-col px-3 py-2 text-left hover:bg-gray-800"
                    >
                      <span className="text-sm text-white">{m.name}</span>
                      <span className="text-xs text-gray-500">{m.phone}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Payment method */}
        <div>
          <p className="mb-1.5 text-xs text-gray-400">{t('pos.cart.paymentMethod')}</p>
          <div className="grid grid-cols-2 gap-1.5">
            {PAYMENT_METHODS.map((method) => (
              <button
                key={method}
                onClick={() => setPaymentMethod(method)}
                className={`rounded-lg border py-1.5 text-xs font-medium transition-colors
                  ${
                    paymentMethod === method
                      ? 'border-yellow-500 bg-yellow-500/10 text-yellow-400'
                      : 'border-gray-700 bg-gray-900/50 text-gray-400 hover:border-gray-600 hover:text-gray-300'
                  }`}
              >
                {t(`pos.payment.${method}`)}
              </button>
            ))}
          </div>
        </div>

        {/* Total + charge */}
        <div className="border-t border-gray-700 pt-3">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm text-gray-400">{t('pos.cart.total')}</span>
            <span className="text-xl font-bold text-white">{formatCurrency(total)}</span>
          </div>
          <Button
            onClick={handleCharge}
            disabled={items.length === 0 || charging || !canCreateSale}
            className="w-full bg-yellow-500 py-5 text-base font-bold text-gray-900 hover:bg-yellow-400 disabled:opacity-40"
          >
            {charging ? '...' : t('pos.cart.charge', { amount: formatCurrency(total) })}
          </Button>
          {!canCreateSale && (
            <p className="text-center text-xs text-red-400">{t('pos.noPermission')}</p>
          )}
        </div>
      </div>
    </div>
  )
}
