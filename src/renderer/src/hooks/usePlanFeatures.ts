import { useLicense } from './useLicense'

const IS_AIRGAPPED = import.meta.env.VITE_BUILD_VARIANT === 'airgapped'

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
  // Airgapped build: all features on except WhatsApp (requires internet)
  airgapped: {
    members: true,
    memberships: true,
    plans: true,
    checkins: true,
    reports: true,
    financialDashboard: true,
    whatsapp: false,
  },
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
  if (IS_AIRGAPPED) return PLAN_FEATURES.airgapped
  return PLAN_FEATURES[planTier] ?? PLAN_FEATURES.basic
}
