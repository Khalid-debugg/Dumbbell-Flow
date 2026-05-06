import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Dialog, DialogContent, DialogTitle } from '../ui/dialog'
import { Input } from '../ui/input'
import { Button } from '../ui/button'
import { Label } from '../ui/label'
import { toast } from 'sonner'
import { Check, Copy, Cpu, ShieldCheck } from 'lucide-react'
import { LanguageSelector } from './LanguageSelector'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'

interface AirgappedActivationProps {
  open: boolean
  onActivated: () => void
  onClose?: () => void
}

export function AirgappedActivation({ open, onActivated, onClose }: AirgappedActivationProps) {
  const { t } = useTranslation('license')
  const [hwid, setHwid] = useState('')
  const [formattedHwid, setFormattedHwid] = useState('')
  const [offlineCode, setOfflineCode] = useState('')
  const [copied, setCopied] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (open) {
      setOfflineCode('')
      window.api.license.getHardwareId().then((result) => {
        if (result.success && result.hardwareId) {
          setHwid(result.hardwareId)
          setFormattedHwid(result.formatted ?? result.hardwareId)
        }
      })
    }
  }, [open])

  const handleCopyHwid = (): void => {
    navigator.clipboard.writeText(hwid)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleActivate = async (): Promise<void> => {
    if (!offlineCode.trim()) {
      toast.error(t('airgapped.enterCode'))
      return
    }
    setIsLoading(true)
    try {
      const result = await window.api.license.activateOffline(offlineCode.trim())
      if (result.success) {
        toast.success(t('airgapped.activationSuccess'))
        setTimeout(() => onActivated(), 800)
      } else {
        toast.error(result.message || t('airgapped.activationError'))
      }
    } catch {
      toast.error(t('airgapped.activationError'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v && onClose) onClose() }}>
      <DialogContent
        className="bg-gray-900 border border-gray-700 text-white max-w-[560px] p-0 overflow-hidden gap-0"
        showCloseButton={!!onClose}
      >
        <VisuallyHidden>
          <DialogTitle>{t('airgapped.title')}</DialogTitle>
        </VisuallyHidden>

        {/* Header */}
        <div className="px-8 pt-8 pb-6 border-b border-gray-700/60">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-500/15 ring-1 ring-orange-500/30">
                <ShieldCheck className="h-5 w-5 text-orange-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white leading-tight">{t('airgapped.title')}</h2>
                <p className="text-sm text-gray-400 mt-0.5">{t('airgapped.description')}</p>
              </div>
            </div>
            <div className="shrink-0 mt-0.5">
              <LanguageSelector />
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-8 py-6 space-y-5">
          {/* HWID */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-widest text-gray-400 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5" />
              {t('airgapped.hwidLabel')}
            </Label>
            <div className="flex gap-2">
              <div className="flex-1 rounded-lg bg-gray-800 border border-gray-700 px-4 py-3 font-mono text-sm text-orange-300 tracking-wider select-all break-all">
                {formattedHwid || '—'}
              </div>
              <Button
                onClick={handleCopyHwid}
                variant="outline"
                size="icon"
                className="border-gray-700 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white shrink-0"
              >
                {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
            <p className="text-xs text-gray-500">{t('airgapped.hwidDescription')}</p>
          </div>

          {/* Activation code */}
          <div className="space-y-2">
            <Label htmlFor="offline-code" className="text-xs font-semibold uppercase tracking-widest text-gray-400">
              {t('airgapped.codeLabel')}
            </Label>
            <Input
              id="offline-code"
              placeholder={t('airgapped.codePlaceholder')}
              value={offlineCode}
              onChange={(e) => setOfflineCode(e.target.value)}
              className="font-mono text-sm bg-gray-800 border-gray-700 text-white placeholder:text-gray-600 focus-visible:ring-orange-500/40 focus-visible:border-orange-500"
              disabled={isLoading}
              onKeyDown={(e) => { if (e.key === 'Enter' && !isLoading) handleActivate() }}
            />
          </div>

          {/* Submit */}
          <Button
            onClick={handleActivate}
            disabled={isLoading || !offlineCode.trim()}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold disabled:opacity-40"
            size="lg"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 ltr:mr-2 rtl:ml-2 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {t('airgapped.activatingButton')}
              </>
            ) : (
              <>
                <Check className="w-4 h-4 ltr:mr-2 rtl:ml-2" />
                {t('airgapped.activateButton')}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
