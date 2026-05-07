import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import { Input } from '@renderer/components/ui/input'
import { Button } from '@renderer/components/ui/button'
import type { StoreProduct, StoreProductCategory } from '@renderer/models/storeProduct'
import { STORE_PRODUCT_CATEGORIES } from '@renderer/models/storeProduct'
import { useStoreProductList } from '@renderer/hooks/useStoreProductList'
import ProductTile from './ProductTile'

interface ProductGridProps {
  onAddToCart: (product: StoreProduct) => void
  canCreateSale: boolean
  formatCurrency: (v: number) => string
  refreshKey: number
}

const ALL_CATEGORIES = ['all', ...STORE_PRODUCT_CATEGORIES] as const
type CategoryFilter = 'all' | StoreProductCategory

export default function ProductGrid({
  onAddToCart,
  canCreateSale,
  formatCurrency,
  refreshKey
}: ProductGridProps) {
  const { t } = useTranslation('store')

  const handleAdd = useCallback(
    (product: StoreProduct) => {
      if (!canCreateSale) {
        toast.error(t('pos.noPermission'))
        return
      }
      onAddToCart(product)
    },
    [canCreateSale, onAddToCart, t]
  )

  const {
    products,
    page,
    setPage,
    totalPages,
    loading,
    error,
    query,
    handleQueryChange,
    category,
    handleCategoryChange
  } = useStoreProductList('store-products:getAll', refreshKey)

  return (
    <div className="flex h-full flex-col gap-3">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          placeholder={t('pos.searchProducts')}
          className="border-gray-700 bg-gray-800 pl-9 text-white placeholder:text-gray-500"
        />
      </div>

      {/* Category tabs */}
      <div className="flex flex-wrap gap-1.5">
        {ALL_CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => handleCategoryChange(cat as CategoryFilter)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors
              ${
                category === cat
                  ? 'bg-yellow-500 text-gray-900'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
              }`}
          >
            {t(`pos.categories.${cat}`)}
          </button>
        ))}
      </div>

      {/* Product grid */}
      <div className="relative flex-1 overflow-hidden">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-900/60">
            <span className="h-6 w-6 animate-spin rounded-full border-2 border-gray-600 border-t-yellow-400" />
          </div>
        )}
        {error && !loading && (
          <div className="flex h-full items-center justify-center text-sm text-red-400">
            {t('errors.loadFailed')}
          </div>
        )}
        {!error && (
          <div className="grid h-full auto-rows-fr grid-cols-2 gap-2 sm:grid-cols-3">
            {!loading && products.length === 0 && (
              <div className="col-span-3 flex flex-col items-center justify-center py-16 text-gray-500">
                <p className="text-sm">{t('products.noProducts')}</p>
                <p className="mt-1 text-xs">{t('products.noProductsHint')}</p>
              </div>
            )}
            {products.map((p) => (
              <ProductTile
                key={p.id}
                product={p}
                onAdd={handleAdd}
                formatCurrency={formatCurrency}
              />
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-700 pt-2">
          <p className="text-xs text-gray-500">
            {t('pagination.page')} {page} {t('pagination.of')} {totalPages}
          </p>
          <div className="flex gap-1.5 ltr:flex-row rtl:flex-row-reverse">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1 || loading}
              onClick={() => setPage((p) => p - 1)}
              className="h-7 gap-1 border-gray-700 bg-gray-800 px-2 text-xs text-gray-300 hover:bg-gray-700 hover:text-white"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              {t('pagination.previous')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page === totalPages || loading}
              onClick={() => setPage((p) => p + 1)}
              className="h-7 gap-1 border-gray-700 bg-gray-800 px-2 text-xs text-gray-300 hover:bg-gray-700 hover:text-white"
            >
              {t('pagination.next')}
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
