import { useTranslation } from 'react-i18next'
import { Input } from '@renderer/components/ui/input'
import { Button } from '@renderer/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@renderer/components/ui/select'
import { STORE_PRODUCT_CATEGORIES } from '@renderer/models/storeProduct'
import type { StoreProductFormData } from '@renderer/models/storeProduct'

interface ProductFormProps {
  data: StoreProductFormData
  onChange: (updates: Partial<StoreProductFormData>) => void
  onSubmit: (e: React.FormEvent) => void
  onCancel: () => void
  submitLabel: string
}

export default function ProductForm({
  data,
  onChange,
  onSubmit,
  onCancel,
  submitLabel
}: ProductFormProps) {
  const { t } = useTranslation('store')

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {/* Name */}
        <div className="col-span-2 space-y-1.5">
          <label className="text-sm text-gray-300">{t('products.form.name')}</label>
          <Input
            required
            value={data.name}
            onChange={(e) => onChange({ name: e.target.value })}
            placeholder={t('products.form.namePlaceholder')}
            className="border-gray-700 bg-gray-900 text-white placeholder:text-gray-600"
          />
        </div>

        {/* Category */}
        <div className="space-y-1.5">
          <label className="text-sm text-gray-300">{t('products.form.category')}</label>
          <Select
            value={data.category}
            onValueChange={(v) => onChange({ category: v as StoreProductFormData['category'] })}
          >
            <SelectTrigger className="border-gray-700 bg-gray-900 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border-gray-700 bg-gray-900 text-white">
              {STORE_PRODUCT_CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {t(`pos.categories.${cat}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Stock */}
        <div className="space-y-1.5">
          <label className="text-sm text-gray-300">{t('products.form.stock')}</label>
          <Input
            type="number"
            min={0}
            required
            value={data.stockQuantity}
            onChange={(e) => onChange({ stockQuantity: Number(e.target.value) })}
            className="border-gray-700 bg-gray-900 text-white"
          />
        </div>

        {/* Price */}
        <div className="space-y-1.5">
          <label className="text-sm text-gray-300">{t('products.form.price')}</label>
          <Input
            type="number"
            min={0}
            step="0.01"
            required
            value={data.price}
            onChange={(e) => onChange({ price: Number(e.target.value) })}
            className="border-gray-700 bg-gray-900 text-white"
          />
        </div>

        {/* Cost price */}
        <div className="space-y-1.5">
          <label className="text-sm text-gray-300">{t('products.form.costPrice')}</label>
          <Input
            type="number"
            min={0}
            step="0.01"
            value={data.costPrice}
            onChange={(e) => onChange({ costPrice: Number(e.target.value) })}
            className="border-gray-700 bg-gray-900 text-white"
          />
        </div>

        {/* Description */}
        <div className="col-span-2 space-y-1.5">
          <label className="text-sm text-gray-300">{t('products.form.description')}</label>
          <Input
            value={data.description ?? ''}
            onChange={(e) => onChange({ description: e.target.value || null })}
            placeholder={t('products.form.descriptionPlaceholder')}
            className="border-gray-700 bg-gray-900 text-white placeholder:text-gray-600"
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="border-gray-600 text-gray-300 hover:bg-gray-800"
        >
          {t('products.form.cancel')}
        </Button>
        <Button type="submit" className="bg-yellow-500 text-gray-900 hover:bg-yellow-400">
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}
