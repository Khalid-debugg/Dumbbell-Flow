import { memo, useCallback, useState, useEffect, type ChangeEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Building2, Upload, ImageIcon } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'
import { PhoneInput } from '@renderer/components/ui/phone-input'
import type { Settings } from '@renderer/models/settings'

interface GymInformationSectionProps {
  gymName: string
  gymAddress: string
  gymPhone: string
  gymCountryCode: string
  gymLogoPath: string
  canEdit: boolean
  onUpdate: (updates: Partial<Settings>) => void
}

export const GymInformationSection = memo(function GymInformationSection({
  gymName,
  gymAddress,
  gymPhone,
  gymCountryCode,
  gymLogoPath,
  canEdit,
  onUpdate
}: GymInformationSectionProps) {
  const { t } = useTranslation('settings')
  const [logoPreview, setLogoPreview] = useState<string | null>(null)

  useEffect(() => {
    if (gymLogoPath) {
      loadLogoPreview(gymLogoPath)
    }
  }, [gymLogoPath])

  const loadLogoPreview = useCallback(async (logoPath: string) => {
    try {
      const result = await window.electron.ipcRenderer.invoke('gym:getLogoPreview', logoPath)
      if (result.success && result.previewUrl) {
        setLogoPreview(result.previewUrl)
      } else {
        console.error('Failed to load logo preview:', result.error)
        setLogoPreview(null)
      }
    } catch (error) {
      console.error('Failed to load logo preview:', error)
      setLogoPreview(null)
    }
  }, [])

  const handleSelectLogo = useCallback(async () => {
    try {
      const result = await window.electron.ipcRenderer.invoke('gym:selectLogo')

      if (!result.canceled && result.logoPath) {
        onUpdate({ gymLogoPath: result.logoPath })
        if (result.previewUrl) {
          setLogoPreview(result.previewUrl)
        }
        toast.success('Logo selected successfully')
      } else if (result.error) {
        toast.error('Failed to select logo: ' + result.error)
      }
    } catch (error) {
      console.error('Failed to select logo:', error)
      toast.error('Failed to select logo')
    }
  }, [onUpdate])

  const handleImageError = useCallback(() => {
    console.error('Failed to load image preview')
    toast.error('Failed to display logo preview')
  }, [])

  const handleGymNameChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => onUpdate({ gymName: e.target.value }),
    [onUpdate]
  )

  const handleGymAddressChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => onUpdate({ gymAddress: e.target.value }),
    [onUpdate]
  )

  const handleCountryCodeChange = useCallback(
    (code: string) => onUpdate({ gymCountryCode: code }),
    [onUpdate]
  )

  const handlePhoneNumberChange = useCallback(
    (number: string) => onUpdate({ gymPhone: number }),
    [onUpdate]
  )

  return (
    <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
      <div className="flex items-center gap-3 mb-6">
        <Building2 className="w-6 h-6 text-blue-400" />
        <h2 className="text-xl font-semibold text-white">{t('gym.title')}</h2>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            {t('gym.name')} <span className="text-red-400">*</span>
          </label>
          <Input
            type="text"
            value={gymName}
            onChange={handleGymNameChange}
            placeholder={t('gym.namePlaceholder')}
            className="bg-gray-900 border-gray-700 text-white"
            disabled={!canEdit}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            {t('gym.address')}
          </label>
          <Input
            type="text"
            value={gymAddress}
            onChange={handleGymAddressChange}
            placeholder={t('gym.addressPlaceholder')}
            className="bg-gray-900 border-gray-700 text-white"
            disabled={!canEdit}
          />
        </div>

        <div>
          <PhoneInput
            countryCode={gymCountryCode}
            phoneNumber={gymPhone}
            onCountryCodeChange={handleCountryCodeChange}
            onPhoneNumberChange={handlePhoneNumberChange}
            label={t('gym.phone')}
            required={false}
            disabled={!canEdit}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            {t('gym.logo')}
          </label>
          <div className="space-y-3">
            {logoPreview && (
              <div className="relative w-32 h-32 bg-gray-900 rounded-lg border border-gray-700 overflow-hidden flex items-center justify-center p-3">
                <img
                  src={logoPreview}
                  alt="Gym Logo"
                  className="max-w-full max-h-full w-auto h-auto object-contain"
                  onError={handleImageError}
                />
              </div>
            )}
            <Button
              type="button"
              variant="primary"
              onClick={handleSelectLogo}
              className="gap-2"
              disabled={!canEdit}
            >
              <Upload className="w-4 h-4" />
              {logoPreview ? t('gym.changeLogo') : t('gym.selectLogo')}
            </Button>
            {!logoPreview && (
              <p className="text-xs text-gray-400 flex items-center gap-2">
                <ImageIcon className="w-3 h-3" />
                {t('gym.defaultLogo')}
              </p>
            )}
            <p className="text-xs text-blue-300 bg-blue-900/20 border border-blue-700/50 rounded p-2">
              {t('gym.logoTip')}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
})
