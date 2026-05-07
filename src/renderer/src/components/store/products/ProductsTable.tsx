import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Pencil,
  Trash2,
  Package,
  ChevronLeft,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  ArrowUpDown
} from 'lucide-react'
import { Input } from '@renderer/components/ui/input'
import { Button } from '@renderer/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@renderer/components/ui/dialog'
import { toast } from 'sonner'
import type {
  StoreProduct,
  StoreProductSortField,
  SortDirection
} from '@renderer/models/storeProduct'
import { STORE_PRODUCT_CATEGORIES } from '@renderer/models/storeProduct'
import { useStoreProductList } from '@renderer/hooks/useStoreProductList'
import EditProductDialog from './EditProductDialog'
import AdjustStockDialog from './AdjustStockDialog'

interface ProductsTableProps {
  onRefreshPOS: () => void
  formatCurrency: (v: number) => string
  refreshKey: number
}

interface SortIconProps {
  sortBy: StoreProductSortField | undefined
  sortDir: SortDirection
}

function SortIcon({ sortBy, sortDir }: SortIconProps) {
  if (sortBy !== 'stock_quantity') return <ArrowUpDown className="h-3 w-3 opacity-40" />
  return sortDir === 'asc' ? (
    <ArrowUp className="h-3 w-3 text-yellow-400" />
  ) : (
    <ArrowDown className="h-3 w-3 text-yellow-400" />
  )
}

export default function ProductsTable({
  onRefreshPOS,
  formatCurrency,
  refreshKey
}: ProductsTableProps) {
  const { t } = useTranslation('store')
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
    handleCategoryChange,
    sortBy,
    sortDir,
    handleSortChange
  } = useStoreProductList('store-products:get', refreshKey)
  const [editTarget, setEditTarget] = useState<StoreProduct | null>(null)
  const [stockTarget, setStockTarget] = useState<StoreProduct | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<StoreProduct | null>(null)
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await window.electron.ipcRenderer.invoke('store-products:delete', deleteTarget.id)
      toast.success(t('products.delete'))
      setDeleteTarget(null)
      onRefreshPOS()
    } catch {
      toast.error(t('errors.deleteFailed'))
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Input
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          placeholder={t('products.search')}
          className="w-56 border-gray-700 bg-gray-800 text-white placeholder:text-gray-500"
        />
        <div className="flex flex-wrap gap-1.5">
          {(['all', ...STORE_PRODUCT_CATEGORIES] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => handleCategoryChange(cat)}
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
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-gray-700">
        <table className="w-full text-sm">
          <thead className="bg-gray-800">
            <tr className="border-b border-gray-700">
              <th className="px-4 py-3 ltr:text-left rtl:text-right font-medium text-gray-400">
                {t('products.form.name')}
              </th>
              <th className="px-4 py-3 ltr:text-left rtl:text-right font-medium text-gray-400">
                {t('products.form.category')}
              </th>
              <th className="px-4 py-3 ltr:text-right rtl:text-left font-medium text-gray-400">
                {t('products.form.price')}
              </th>
              <th
                className="cursor-pointer select-none px-4 py-3 ltr:text-right rtl:text-left font-medium text-gray-400 hover:text-white"
                onClick={() => handleSortChange('stock_quantity')}
              >
                <div className="flex items-center justify-end gap-1">
                  {t('products.form.stock')}
                  <SortIcon sortBy={sortBy} sortDir={sortDir} />
                </div>
              </th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700/50 bg-gray-900">
            {loading && (
              <tr>
                <td colSpan={5} className="py-12 text-center text-gray-500">
                  <div className="flex items-center justify-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-600 border-t-yellow-400" />
                  </div>
                </td>
              </tr>
            )}
            {error && !loading && (
              <tr>
                <td colSpan={5} className="py-12 text-center text-sm text-red-400">
                  {t('errors.loadFailed')}
                </td>
              </tr>
            )}
            {!loading && !error && products.length === 0 && (
              <tr>
                <td colSpan={5} className="py-12 text-center text-gray-500">
                  {t('products.noProducts')}
                </td>
              </tr>
            )}
            {!loading &&
              !error &&
              products.map((p) => (
                <tr key={p.id} className="transition-colors hover:bg-gray-800/50">
                  <td className="px-4 py-3 font-medium text-white">{p.name}</td>
                  <td className="px-4 py-3 text-gray-400">{t(`pos.categories.${p.category}`)}</td>
                  <td className="px-4 py-3 ltr:text-right rtl:text-left text-yellow-400">
                    {formatCurrency(p.price)}
                  </td>
                  <td className="px-4 py-3 ltr:text-right rtl:text-left">
                    <span
                      className={`font-medium ${p.stockQuantity === 0 ? 'text-red-400' : p.stockQuantity <= 5 ? 'text-orange-400' : 'text-gray-300'}`}
                    >
                      {p.stockQuantity === 0 ? t('products.outOfStock') : p.stockQuantity}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setStockTarget(p)}
                        className="h-7 w-7 p-0 text-gray-400 hover:text-white"
                        title={t('products.adjustStock.title')}
                      >
                        <Package className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditTarget(p)}
                        className="h-7 w-7 p-0 text-gray-400 hover:text-white"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setDeleteTarget(p)}
                        className="h-7 w-7 p-0 text-gray-400 hover:text-red-400"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <p className="text-sm text-gray-400">
            {t('pagination.page')} {page} {t('pagination.of')} {totalPages}
          </p>
          <div className="flex gap-2 ltr:flex-row rtl:flex-row-reverse">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="gap-1 border-gray-700 bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white"
            >
              <ChevronLeft className="h-4 w-4" />
              {t('pagination.previous')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="gap-1 border-gray-700 bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white"
            >
              {t('pagination.next')}
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <EditProductDialog
        product={editTarget}
        onClose={() => setEditTarget(null)}
        onSuccess={() => {
          setEditTarget(null)
          onRefreshPOS()
        }}
      />
      <AdjustStockDialog
        product={stockTarget}
        onClose={() => setStockTarget(null)}
        onSuccess={() => {
          setStockTarget(null)
          onRefreshPOS()
        }}
      />

      {/* Delete confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="max-w-sm border-gray-700 bg-gray-900 text-white">
          <DialogHeader>
            <DialogTitle>{t('products.delete')}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-300">
            {t('products.deleteConfirm', { name: deleteTarget?.name })}
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              {t('products.form.cancel')}
            </Button>
            <Button
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 text-white hover:bg-red-500 disabled:opacity-50"
            >
              {t('products.delete')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
