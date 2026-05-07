import { useState, useCallback, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ShoppingCart, Package, History } from 'lucide-react'
import { useSettings } from '@renderer/hooks/useSettings'
import { useAuth } from '@renderer/hooks/useAuth'
import { PERMISSIONS } from '@renderer/models/account'
import type { StoreProduct } from '@renderer/models/storeProduct'
import type { SaleCartItem } from '@renderer/models/storeSale'
import ProductGrid from '@renderer/components/store/pos/ProductGrid'
import Cart from '@renderer/components/store/pos/Cart'
import ProductsTable from '@renderer/components/store/products/ProductsTable'
import CreateProductDialog from '@renderer/components/store/products/CreateProductDialog'
import SalesTable from '@renderer/components/store/history/SalesTable'

type Tab = 'pos' | 'products' | 'history'

export default function Store() {
  const { t } = useTranslation('store')
  const { settings } = useSettings()
  const { hasPermission } = useAuth()
  const [activeTab, setActiveTab] = useState<Tab>('pos')
  const [cart, setCart] = useState<SaleCartItem[]>([])
  const [posRefreshKey, setPosRefreshKey] = useState(0)
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0)

  const canManageProducts = hasPermission(PERMISSIONS.store.manage_products)
  const canViewSales = hasPermission(PERMISSIONS.store.view_sales)
  const canCreateSale = hasPermission(PERMISSIONS.store.create_sale)
  const canDeleteSale = hasPermission(PERMISSIONS.store.delete_sale)

  const tabs = useMemo<{ id: Tab; icon: React.ReactNode; label: string }[]>(
    () => [
      { id: 'pos', icon: <ShoppingCart className="h-4 w-4" />, label: t('tabs.pos') },
      ...(canManageProducts
        ? [
            {
              id: 'products' as Tab,
              icon: <Package className="h-4 w-4" />,
              label: t('tabs.products')
            }
          ]
        : []),
      ...(canViewSales
        ? [
            {
              id: 'history' as Tab,
              icon: <History className="h-4 w-4" />,
              label: t('tabs.history')
            }
          ]
        : [])
    ],
    [canManageProducts, canViewSales, t]
  )

  useEffect(() => {
    if (!tabs.find((tab) => tab.id === activeTab)) {
      setActiveTab(tabs[0]?.id ?? 'pos')
    }
  }, [tabs, activeTab])

  const formatCurrency = useCallback(
    (value: number) =>
      new Intl.NumberFormat(settings?.language, {
        style: 'currency',
        currency: settings?.currency,
        minimumFractionDigits: 0
      }).format(value),
    [settings?.language, settings?.currency]
  )

  const handleAddToCart = useCallback((product: StoreProduct) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.productId === product.id)
      if (existing) {
        return prev.map((item) =>
          item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item
        )
      }
      return [
        ...prev,
        {
          productId: product.id as string,
          productName: product.name,
          unitPrice: product.price,
          quantity: 1,
          stockQuantity: product.stockQuantity
        }
      ]
    })
  }, [])

  const handleUpdateQty = useCallback((productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.productId === productId ? { ...item, quantity: item.quantity + delta } : item
        )
        .filter((item) => item.quantity > 0)
    )
  }, [])

  const handleRemove = useCallback((productId: string) => {
    setCart((prev) => prev.filter((item) => item.productId !== productId))
  }, [])

  const handleSaleComplete = useCallback(() => {
    setPosRefreshKey((k) => k + 1)
    setHistoryRefreshKey((k) => k + 1)
  }, [])

  const handleProductsChanged = useCallback(() => {
    setPosRefreshKey((k) => k + 1)
  }, [])

  return (
    <div className="flex h-full flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">{t('nav')}</h1>
        <div className="flex items-center gap-2">
          {activeTab === 'products' && canManageProducts && (
            <CreateProductDialog onSuccess={handleProductsChanged} />
          )}
          {/* Tab switcher */}
          <div className="flex rounded-lg border border-gray-700 bg-gray-800 p-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors
                  ${
                    activeTab === tab.id
                      ? 'bg-gray-700 text-white'
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* POS — split panel */}
      {activeTab === 'pos' && (
        <div className="grid flex-1 grid-cols-[1fr_360px] gap-4 overflow-hidden">
          <div className="overflow-hidden">
            <ProductGrid
              onAddToCart={handleAddToCart}
              canCreateSale={canCreateSale}
              formatCurrency={formatCurrency}
              refreshKey={posRefreshKey}
            />
          </div>
          <Cart
            items={cart}
            onUpdateQty={handleUpdateQty}
            onRemove={handleRemove}
            onClear={() => setCart([])}
            onSaleComplete={handleSaleComplete}
            formatCurrency={formatCurrency}
            canCreateSale={canCreateSale}
          />
        </div>
      )}

      {/* Products */}
      {activeTab === 'products' && canManageProducts && (
        <ProductsTable
          onRefreshPOS={handleProductsChanged}
          formatCurrency={formatCurrency}
          refreshKey={posRefreshKey}
        />
      )}

      {/* History */}
      {activeTab === 'history' && canViewSales && (
        <SalesTable
          formatCurrency={formatCurrency}
          refreshKey={historyRefreshKey}
          canDelete={canDeleteSale}
        />
      )}
    </div>
  )
}
