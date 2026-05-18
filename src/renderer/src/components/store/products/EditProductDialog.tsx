import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@renderer/components/ui/dialog'
import type { StoreProduct, StoreProductFormData } from '@renderer/models/storeProduct'
import ProductForm from './ProductForm'

interface EditProductDialogProps {
  product: StoreProduct | null
  onClose: () => void
  onSuccess: () => void
}

export default function EditProductDialog({ product, onClose, onSuccess }: EditProductDialogProps) {
  const { t } = useTranslation('store')
  const [data, setData] = useState<StoreProductFormData | null>(null)

  useEffect(() => {
    if (product) {
      setData({
        name: product.name,
        description: product.description,
        category: product.category,
        price: product.price,
        costPrice: product.costPrice,
        stockQuantity: product.stockQuantity,
        expiryDate: product.expiryDate
      })
    }
  }, [product])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!product || !data) return
    try {
      await window.electron.ipcRenderer.invoke('store-products:update', product.id, data)
      toast.success(t('products.form.save'))
      onSuccess()
      onClose()
    } catch {
      toast.error(t('errors.saveFailed'))
    }
  }

  return (
    <Dialog open={!!product} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="border-gray-700 bg-gray-900 text-white">
        <DialogHeader>
          <DialogTitle>{t('products.edit')}</DialogTitle>
        </DialogHeader>
        {data && (
          <ProductForm
            data={data}
            onChange={(updates) => setData((prev) => (prev ? { ...prev, ...updates } : prev))}
            onSubmit={handleSubmit}
            onCancel={onClose}
            submitLabel={t('products.form.save')}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
