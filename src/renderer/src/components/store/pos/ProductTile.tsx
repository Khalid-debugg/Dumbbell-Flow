import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import type { StoreProduct } from '@renderer/models/storeProduct'

interface ProductTileProps {
  product: StoreProduct
  onAdd: (product: StoreProduct) => void
  formatCurrency: (v: number) => string
}

function ProductTile({ product, onAdd, formatCurrency }: ProductTileProps) {
  const { t } = useTranslation('store')
  const outOfStock = product.stockQuantity === 0
  const lowStock = product.stockQuantity > 0 && product.stockQuantity <= 5

  return (
    <button
      onClick={() => !outOfStock && onAdd(product)}
      disabled={outOfStock}
      className={`relative flex h-full w-full flex-col rounded-lg border p-3 text-left transition-all
        ${
          outOfStock
            ? 'cursor-not-allowed border-gray-700 bg-gray-800/40 opacity-50'
            : 'cursor-pointer border-gray-700 bg-gray-800 hover:border-yellow-500/60 hover:bg-gray-750 active:scale-[0.97]'
        }`}
    >
      {/* Stock badge */}
      {outOfStock && (
        <span className="absolute left-2 top-2 rounded-full bg-red-900/70 px-2 py-0.5 text-[10px] font-medium text-red-300">
          {t('pos.outOfStock')}
        </span>
      )}
      {lowStock && !outOfStock && (
        <span className="absolute left-2 top-2 rounded-full bg-orange-900/70 px-2 py-0.5 text-[10px] font-medium text-orange-300">
          {t('pos.lowStock', { count: product.stockQuantity })}
        </span>
      )}

      {/* Category dot */}
      <div className="mb-2 flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-yellow-500" />
        <span className="text-[10px] uppercase tracking-wide text-gray-500">
          {t(`pos.categories.${product.category}`)}
        </span>
      </div>

      <p className="mb-1 line-clamp-2 text-sm font-semibold leading-tight text-white">
        {product.name}
      </p>
      <p className="mt-auto pt-2 text-base font-bold text-yellow-400">
        {formatCurrency(product.price)}
      </p>
    </button>
  )
}

export default memo(ProductTile)
