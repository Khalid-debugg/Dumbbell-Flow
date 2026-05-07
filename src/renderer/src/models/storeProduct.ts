export const STORE_PRODUCT_CATEGORIES = [
  'drinks',
  'meals',
  'supplements',
  'apparel',
  'essentials',
  'other'
] as const
export type StoreProductCategory = (typeof STORE_PRODUCT_CATEGORIES)[number]

export type StoreProduct = {
  id?: string
  name: string
  description: string | null
  category: StoreProductCategory
  price: number
  costPrice: number
  stockQuantity: number
  createdAt?: string
  updatedAt?: string
}

export type StoreProductDbRow = {
  id: string
  name: string
  description: string | null
  category: StoreProductCategory
  price: number
  cost_price: number
  stock_quantity: number
  created_at: string
  updated_at: string
}

export type StoreProductSortField = 'stock_quantity' | 'name' | 'price'
export type SortDirection = 'asc' | 'desc' | ''

export interface StoreProductFilters {
  query: string
  category: 'all' | StoreProductCategory
  inStockOnly: boolean
  sortBy: StoreProductSortField
  sortDir: SortDirection
}

export const DEFAULT_STORE_PRODUCT_FILTERS: StoreProductFilters = {
  query: '',
  category: 'all',
  inStockOnly: false,
  sortBy: 'name',
  sortDir: 'asc'
}

export type StoreProductFormData = Omit<StoreProduct, 'id' | 'createdAt' | 'updatedAt'>
