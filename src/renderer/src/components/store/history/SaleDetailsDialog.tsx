import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@renderer/components/ui/dialog'
import type { StoreSale } from '@renderer/models/storeSale'

interface SaleDetailsDialogProps {
  saleId: string | null
  onClose: () => void
  formatCurrency: (v: number) => string
}

export default function SaleDetailsDialog({
  saleId,
  onClose,
  formatCurrency
}: SaleDetailsDialogProps) {
  const { t } = useTranslation('store')
  const [sale, setSale] = useState<StoreSale | null>(null)

  useEffect(() => {
    if (!saleId) {
      setSale(null)
      return
    }
    window.electron.ipcRenderer
      .invoke('store-sales:getById', saleId)
      .then((result) => setSale(result as StoreSale))
  }, [saleId])

  return (
    <Dialog open={!!saleId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="border-gray-700 bg-gray-900 text-white max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('history.detail.title')}</DialogTitle>
        </DialogHeader>
        {sale && (
          <div className="space-y-4">
            {/* Meta */}
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-400">{t('history.detail.date')}: </span>
                <span className="text-white">
                  {new Date(sale.soldAt.replace(' ', 'T') + 'Z').toLocaleString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
              <div>
                <span className="text-gray-400">{t('history.detail.payment')}: </span>
                <span className="text-white">{t(`pos.payment.${sale.paymentMethod}`)}</span>
              </div>
              <div className="col-span-2">
                <span className="text-gray-400">{t('history.detail.member')}: </span>
                <span className="text-white">{sale.memberName ?? t('history.walkIn')}</span>
              </div>
            </div>

            {/* Line items */}
            <div className="overflow-hidden rounded-lg border border-gray-700">
              <table className="w-full text-sm">
                <thead className="bg-gray-800">
                  <tr>
                    <th className="px-3 py-2 text-left text-gray-400">
                      {t('history.detail.product')}
                    </th>
                    <th className="px-3 py-2 text-center text-gray-400">
                      {t('history.detail.qty')}
                    </th>
                    <th className="px-3 py-2 text-right text-gray-400">
                      {t('history.detail.unitPrice')}
                    </th>
                    <th className="px-3 py-2 text-right text-gray-400">
                      {t('history.detail.subtotal')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/50">
                  {(sale.items ?? []).map((item) => (
                    <tr key={item.id}>
                      <td className="px-3 py-2 text-white">{item.productName}</td>
                      <td className="px-3 py-2 text-center text-gray-300">{item.quantity}</td>
                      <td className="px-3 py-2 text-right text-gray-300">
                        {formatCurrency(item.unitPrice)}
                      </td>
                      <td className="px-3 py-2 text-right font-medium text-yellow-400">
                        {formatCurrency(item.subtotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Total */}
            <div className="flex items-center justify-between border-t border-gray-700 pt-3">
              <span className="text-gray-400">{t('history.detail.total')}</span>
              <span className="text-xl font-bold text-white">
                {formatCurrency(sale.totalAmount)}
              </span>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
