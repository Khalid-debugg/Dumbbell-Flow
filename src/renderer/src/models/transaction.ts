export const TRANSACTION_TYPES = ['income', 'expense'] as const
export type TransactionType = (typeof TRANSACTION_TYPES)[number]

export const EXPENSE_CATEGORIES = [
  'inventory_purchase',
  'rent',
  'utilities',
  'salaries',
  'equipment',
  'maintenance',
  'marketing',
  'other'
] as const

export const INCOME_CATEGORIES = ['other'] as const

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number]
export type IncomeCategory = (typeof INCOME_CATEGORIES)[number]
export type TransactionCategory = ExpenseCategory | IncomeCategory

export const PAYMENT_METHODS = ['cash', 'card', 'transfer', 'e-wallet'] as const
export type PaymentMethod = (typeof PAYMENT_METHODS)[number]

export type Transaction = {
  id: string
  type: TransactionType
  category: string
  amount: number
  date: string
  description?: string
  paymentMethod?: PaymentMethod
  reference?: string
  createdAt: string
  updatedAt: string
}

export type TransactionDbRow = {
  id: string
  type: TransactionType
  category: TransactionCategory
  amount: number
  date: string
  description: string | null
  payment_method: PaymentMethod | null
  reference: string | null
  created_at: string
  updated_at: string
}

export interface TransactionFilters {
  query: string
  type: 'all' | TransactionType
  category: 'all' | TransactionCategory
  dateFrom: string
  dateTo: string
}

export const DEFAULT_TRANSACTION_FILTERS: TransactionFilters = {
  query: '',
  type: 'all',
  category: 'all',
  dateFrom: '',
  dateTo: ''
}

export type TransactionFormData = {
  type: TransactionType
  category: string
  customCategory?: string
  amount: number
  date: string
  description?: string
  paymentMethod?: PaymentMethod
  reference?: string
}
