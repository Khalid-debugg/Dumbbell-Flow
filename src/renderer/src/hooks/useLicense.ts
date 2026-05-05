import { useState, useEffect } from 'react'

interface UseLicenseReturn {
  isLicensed: boolean
  isExpired: boolean
  daysRemaining: number
  planTier: string
  isCheckingLicense: boolean
  setIsLicensed: (licensed: boolean) => void
}

export function useLicense(): UseLicenseReturn {
  const [isLicensed, setIsLicensed] = useState<boolean>(false)
  const [isExpired, setIsExpired] = useState<boolean>(false)
  const [daysRemaining, setDaysRemaining] = useState<number>(0)
  const [planTier, setPlanTier] = useState<string>('basic')
  const [isCheckingLicense, setIsCheckingLicense] = useState<boolean>(true)

  useEffect(() => {
    checkLicense()
  }, [])

  const checkLicense = async (): Promise<void> => {
    try {
      const licensed = await window.api.license.isLicensed()
      const status = await window.api.license.getStatus()
      setIsLicensed(licensed)
      setDaysRemaining(status.daysRemaining ?? 0)
      setPlanTier(status.licenseData?.planTier ?? 'basic')
      // Expired = has a license file but access is no longer valid
      setIsExpired(!licensed && (status.hasLicenseFile ?? false))
    } catch (error) {
      console.error('Error checking license:', error)
      setIsLicensed(false)
    } finally {
      setIsCheckingLicense(false)
    }
  }

  return {
    isLicensed,
    isExpired,
    daysRemaining,
    planTier,
    isCheckingLicense,
    setIsLicensed
  }
}
