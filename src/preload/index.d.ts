import { ElectronAPI } from '@electron-toolkit/preload'

interface LicenseAPI {
  getHardwareId: () => Promise<{
    success: boolean
    hardwareId?: string
    formatted?: string
    error?: string
  }>
  isLicensed: () => Promise<boolean>
  activate: (licenseKey: string) => Promise<{
    success: boolean
    message: string
  }>
  activateOffline: (code: string) => Promise<{
    success: boolean
    message: string
  }>
  getStatus: () => Promise<{
    isLicensed: boolean
    reason?: string
    daysRemaining?: number
    requiresPayment?: boolean
    hardwareId?: string
    formattedHardwareId?: string
    hasLicenseFile?: boolean
    licenseData?: {
      activatedAt: string
      licenseEndsAt: string | null
      subscriptionStatus: string
      planTier: string
    } | null
    error?: string
  }>
  deactivate: () => Promise<{ success: boolean; message: string }>
}

interface SeedAPI {
  database: (options?: {
    numMembers?: number
    numPlans?: number
    checkInRate?: number
    clearExisting?: boolean
  }) => Promise<{
    success: boolean
    message: string
    stats?: {
      plans: number
      members: number
      memberships: number
      checkIns: number
      scenarios: {
        active: number
        expiring: number
        expired: number
        inactive: number
      }
    }
  }>
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      license: LicenseAPI
      seed: SeedAPI
    }
  }
}
