export const PAYMENT_METHODS = ['cash', 'card', 'transfer', 'e-wallet'] as const
export type PaymentMethod = (typeof PAYMENT_METHODS)[number]

export type StoreSaleItem = {
  id: string
  saleId: string
  productId: string
  productName: string
  quantity: number
  unitPrice: number
  subtotal: number
  createdAt: string
}

export type StoreSaleItemDbRow = {
  id: string
  sale_id: string
  product_id: string
  product_name: string
  quantity: number
  unit_price: number
  subtotal: number
  created_at: string
}

export type StoreSale = {
  id: string
  memberId: string | null
  memberName?: string | null
  totalAmount: number
  paymentMethod: PaymentMethod
  notes: string | null
  soldAt: string
  createdAt: string
  items?: StoreSaleItem[]
}

export type StoreSaleDbRow = {
  id: string
  member_id: string | null
  member_name?: string | null
  total_amount: number
  payment_method: PaymentMethod
  notes: string | null
  sold_at: string
  created_at: string
}

// Cart item used in the POS UI before a sale is committed
export type SaleCartItem = {
  productId: string
  productName: string
  unitPrice: number
  quantity: number
  stockQuantity: number
}

export interface StoreSaleFilters {
  dateFrom: string
  dateTo: string
  paymentMethod: 'all' | PaymentMethod
  memberId: string
}

export const DEFAULT_STORE_SALE_FILTERS: StoreSaleFilters = {
  dateFrom: '',
  dateTo: '',
  paymentMethod: 'all',
  memberId: ''
}
