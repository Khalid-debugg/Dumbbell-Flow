export const CLASS_RULE_STATUS = ['active', 'completed'] as const
export type ClassRuleStatus = (typeof CLASS_RULE_STATUS)[number]

export const CLASS_PLAN_TYPES = ['per_class', 'per_week', 'per_month', 'per_year'] as const
export type ClassPlanType = (typeof CLASS_PLAN_TYPES)[number]

export const DAYS_OF_WEEK = [0, 1, 2, 3, 4, 5, 6] as const
export type DayOfWeek = (typeof DAYS_OF_WEEK)[number]

export const CLASS_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
  '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#3b82f6', '#06b6d4', '#a855f7', '#f43f5e'
] as const
export type ClassColor = (typeof CLASS_COLORS)[number]

export type ClassRule = {
  id?: string
  name: string
  category: string
  color: ClassColor
  coachName: string
  startDate: string
  startTime: string | null
  pricePerClass: number | null
  pricePerWeek: number | null
  pricePerMonth: number | null
  pricePerYear: number | null
  status: ClassRuleStatus
  days?: DayOfWeek[]
  subscriberCount?: number
  createdAt?: string
  updatedAt?: string
}

export type ClassRuleDbRow = {
  id: string
  name: string
  category: string
  color: string
  coach_name: string
  start_date: string
  start_time: string | null
  price_per_class: number | null
  price_per_week: number | null
  price_per_month: number | null
  price_per_year: number | null
  status: ClassRuleStatus
  created_at: string
  updated_at: string
}

export type ClassInstance = {
  id?: string
  ruleId: string | null
  name: string
  category: string
  color: ClassColor
  coachName: string
  scheduledDate: string
  dayOfWeek: DayOfWeek | null
  isRecurring: boolean
  status: 'upcoming' | 'completed'
  startTime: string | null
  pricePerClass: number | null
  pricePerWeek: number | null
  pricePerMonth: number | null
  pricePerYear: number | null
  subscriberCount?: number
  createdAt?: string
  updatedAt?: string
}

export type ClassInstanceDbRow = {
  id: string
  rule_id: string | null
  name: string
  category: string
  color: string
  coach_name: string
  scheduled_date: string
  day_of_week: number | null
  is_recurring: number
  status: 'upcoming' | 'completed'
  start_time: string | null
  price_per_class: number | null
  price_per_week: number | null
  price_per_month: number | null
  price_per_year: number | null
  created_at: string
  updated_at: string
}

export type ClassSubscriber = {
  id?: string
  memberId: string
  memberName?: string
  memberPhone?: string
  memberCountryCode?: string
  ruleId: string | null
  instanceId: string | null
  planType: ClassPlanType
  amount: number
  amountPaid: number
  isPartialPayment: boolean
  createdAt?: string
}

export type ClassSubscriberDbRow = {
  id: string
  member_id: string
  member_name: string
  member_phone: string
  rule_id: string | null
  instance_id: string | null
  plan_type: ClassPlanType
  amount: number
  amount_paid: number
  is_partial_payment: number
  created_at: string
}

export interface ClassRuleFilters {
  query: string
  status: 'all' | ClassRuleStatus
}

export const DEFAULT_CLASS_RULE_FILTERS: ClassRuleFilters = { query: '', status: 'all' }

export interface ClassSubscriberFilters {
  query: string
  className: string
}

export const DEFAULT_CLASS_SUBSCRIBER_FILTERS: ClassSubscriberFilters = {
  query: '',
  className: ''
}

export type ClassRuleFormData = Omit<ClassRule, 'id' | 'status' | 'subscriberCount' | 'createdAt' | 'updatedAt'> & {
  days: DayOfWeek[]
  subscribers: ClassSubscriberFormData[]
}

export type ClassInstanceFormData = Omit<ClassInstance, 'id' | 'status' | 'ruleId' | 'subscriberCount' | 'createdAt' | 'updatedAt'> & {
  subscribers: ClassSubscriberFormData[]
}

export type ClassSubscriberFormData = {
  memberId: string
  memberName?: string
  memberPhone?: string
  memberCountryCode?: string
  planType: ClassPlanType
  amount: number
  amountPaid: number
  isPartialPayment: boolean
}
