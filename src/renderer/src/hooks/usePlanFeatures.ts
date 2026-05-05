import { useLicense } from './useLicense'

export interface PlanFeatures {
  members: boolean
  memberships: boolean
  plans: boolean
  checkins: boolean
  reports: boolean
  financialDashboard: boolean
  whatsapp: boolean
}

const PLAN_FEATURES: Record<string, PlanFeatures> = {
  trial: {
    members: true,
    memberships: true,
    plans: true,
    checkins: true,
    reports: true,
    financialDashboard: true,
    whatsapp: true,
  },
  basic: {
    members: true,
    memberships: true,
    plans: true,
    checkins: true,
    reports: false,
    financialDashboard: false,
    whatsapp: false,
  },
  pro: {
    members: true,
    memberships: true,
    plans: true,
    checkins: true,
    reports: true,
    financialDashboard: true,
    whatsapp: false,
  },
  premium: {
    members: true,
    memberships: true,
    plans: true,
    checkins: true,
    reports: true,
    financialDashboard: true,
    whatsapp: true,
  },
}

export function usePlanFeatures(): PlanFeatures {
  const { planTier } = useLicense()
  return PLAN_FEATURES[planTier] ?? PLAN_FEATURES.basic
}
