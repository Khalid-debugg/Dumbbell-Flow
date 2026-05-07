import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Minus, Plus } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@renderer/components/ui/dialog'
import { Button } from '@renderer/components/ui/button'
import type { StoreProduct } from '@renderer/models/storeProduct'

interface AdjustStockDialogProps {
  product: StoreProduct | null
  onClose: () => void
  onSuccess: () => void
}

export default function AdjustStockDialog({ product, onClose, onSuccess }: AdjustStockDialogProps) {
  const { t } = useTranslation('store')
  const [newQty, setNewQty] = useState(0)

  useEffect(() => {
    if (product) setNewQty(product.stockQuantity)
  }, [product])

  const delta = product ? newQty - product.stockQuantity : 0
  const deltaLabel = delta === 0 ? '—' : delta > 0 ? `+${delta}` : `${delta}`
  const deltaColor = delta > 0 ? 'text-green-400' : delta < 0 ? 'text-red-400' : 'text-gray-500'

  const handleConfirm = async () => {
    if (!product || delta === 0) return
    try {
      await window.electron.ipcRenderer.invoke('store-products:adjustStock', product.id, delta)
      toast.success(t('products.adjustStock.confirm'))
      onSuccess()
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('products.adjustStock.error'))
    }
  }

  return (
    <Dialog open={!!product} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="border-gray-700 bg-gray-900 text-white max-w-xs">
        <DialogHeader>
          <DialogTitle className="truncate">{product?.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Current stock */}
          <div className="rounded-lg border border-gray-700 bg-gray-800/60 px-4 py-3 text-center">
            <p className="text-xs text-gray-500">{t('products.adjustStock.current')}</p>
            <p className="mt-0.5 text-3xl font-bold text-white">{product?.stockQuantity ?? 0}</p>
          </div>

          {/* Counter */}
          <div>
            <p className="mb-2 text-center text-xs text-gray-400">{t('products.adjustStock.newQty')}</p>
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => setNewQty((q) => Math.max(0, q - 1))}
                disabled={newQty === 0}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-600 bg-gray-800 text-gray-300 transition-colors hover:border-gray-500 hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-30"
              >
                <Minus className="h-4 w-4" />
              </button>

              <span className="w-16 text-center text-3xl font-bold tabular-nums text-white">
                {newQty}
              </span>

              <button
                onClick={() => setNewQty((q) => q + 1)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-600 bg-gray-800 text-gray-300 transition-colors hover:border-gray-500 hover:bg-gray-700"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            {/* Delta indicator */}
            <p className={`mt-3 text-center text-sm font-medium ${deltaColor}`}>
              {t('products.adjustStock.change')}: {deltaLabel}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              {t('products.adjustStock.cancel')}
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={delta === 0}
              className="flex-1 bg-yellow-500 text-gray-900 hover:bg-yellow-400 disabled:opacity-40"
            >
              {t('products.adjustStock.confirm')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
