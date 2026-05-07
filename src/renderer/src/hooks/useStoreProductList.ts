import { useState, useEffect, useCallback } from 'react'
import type {
  StoreProduct,
  StoreProductCategory,
  StoreProductSortField,
  SortDirection
} from '@renderer/models/storeProduct'

type CategoryFilter = 'all' | StoreProductCategory

interface PageResponse {
  products: StoreProduct[]
  totalPages: number
}

export function useStoreProductList(
  channel: 'store-products:get' | 'store-products:getAll',
  refreshKey: number
) {
  const [products, setProducts] = useState<StoreProduct[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [category, setCategory] = useState<CategoryFilter>('all')
  const [sortBy, setSortBy] = useState<StoreProductSortField | undefined>(undefined)
  const [sortDir, setSortDir] = useState<SortDirection>('asc')

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300)
    return () => clearTimeout(timer)
  }, [query])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = (await window.electron.ipcRenderer.invoke(channel, page, {
        query: debouncedQuery,
        category,
        sortBy,
        sortDir
      })) as PageResponse
      setProducts(result.products)
      setTotalPages(result.totalPages)
    } catch (err) {
      setError(err instanceof Error ? err.message : '')
      setProducts([])
    } finally {
      setLoading(false)
    }
  }, [channel, page, debouncedQuery, category, sortBy, sortDir])

  useEffect(() => {
    load()
  }, [load, refreshKey])

  const handleQueryChange = useCallback((value: string) => {
    setQuery(value)
    setPage(1)
  }, [])

  const handleCategoryChange = useCallback((value: CategoryFilter) => {
    setCategory(value)
    setPage(1)
  }, [])

  const handleSortChange = useCallback(
    (field: StoreProductSortField) => {
      if (sortBy === field) {
        if (sortDir === 'asc') {
          setSortDir('desc')
        } else {
          setSortBy(undefined)
          setSortDir('asc')
        }
      } else {
        setSortBy(field)
        setSortDir('asc')
      }
      setPage(1)
    },
    [sortBy, sortDir]
  )

  return {
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
  }
}
