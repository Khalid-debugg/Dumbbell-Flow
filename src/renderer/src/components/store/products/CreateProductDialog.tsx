import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@renderer/components/ui/dialog'
import { Button } from '@renderer/components/ui/button'
import type { StoreProductFormData } from '@renderer/models/storeProduct'
import ProductForm from './ProductForm'

interface CreateProductDialogProps {
  onSuccess: () => void
}

const DEFAULT_FORM: StoreProductFormData = {
  name: '',
  description: null,
  category: 'other',
  price: 0,
  costPrice: 0,
  stockQuantity: 0,
  expiryDate: null
}

export default function CreateProductDialog({ onSuccess }: CreateProductDialogProps) {
  const { t } = useTranslation('store')
  const [open, setOpen] = useState(false)
  const [data, setData] = useState<StoreProductFormData>(DEFAULT_FORM)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await window.electron.ipcRenderer.invoke('store-products:create', data)
      toast.success(t('products.form.create'))
      setOpen(false)
      setData(DEFAULT_FORM)
      onSuccess()
    } catch {
      toast.error(t('errors.saveFailed'))
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-yellow-500 text-gray-900 hover:bg-yellow-400">
          <Plus className="h-4 w-4" />
          {t('products.add')}
        </Button>
      </DialogTrigger>
      <DialogContent className="border-gray-700 bg-gray-900 text-white">
        <DialogHeader>
          <DialogTitle>{t('products.add')}</DialogTitle>
        </DialogHeader>
        <ProductForm
          data={data}
          onChange={(updates) => setData((prev) => ({ ...prev, ...updates }))}
          onSubmit={handleSubmit}
          onCancel={() => setOpen(false)}
          submitLabel={t('products.form.create')}
        />
      </DialogContent>
    </Dialog>
  )
}
