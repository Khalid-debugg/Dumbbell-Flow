import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog'
import { Input } from '../ui/input'
import { Button } from '../ui/button'
import { Label } from '../ui/label'
import { toast } from 'sonner'
import { Check, ExternalLink, Globe, KeyRound, ChevronRight, ArrowLeft } from 'lucide-react'
import { LanguageSelector } from './LanguageSelector'
import { AirgappedActivation } from './AirgappedActivation'

const IS_AIRGAPPED = import.meta.env.VITE_BUILD_VARIANT === 'airgapped'

interface LicenseActivationProps {
  open: boolean
  onActivated: () => void
}

const ACTIVATION_PORTAL_URL =
  import.meta.env.VITE_ACTIVATION_PORTAL_URL || 'https://dumbbellflow.com'

export function LicenseActivation({ open, onActivated }: LicenseActivationProps) {
  if (IS_AIRGAPPED) return <AirgappedActivation open={open} onActivated={onActivated} />

  const { t } = useTranslation('license')
  const [currentStep, setCurrentStep] = useState(1)
  const [licenseKey, setLicenseKey] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())

  useEffect(() => {
    if (open) {
      setCurrentStep(1)
      setLicenseKey('')
      setCompletedSteps(new Set())
    }
  }, [open])

  const markStepComplete = (step: number): void => {
    setCompletedSteps((prev) => new Set(prev).add(step))
  }

  const handleOpenPortal = (): void => {
    window.open(ACTIVATION_PORTAL_URL, '_blank')
    markStepComplete(1)
    setTimeout(() => setCurrentStep(2), 500)
  }

  const handleContinueToActivation = (): void => {
    markStepComplete(2)
    setCurrentStep(3)
  }

  const handleStepBack = (): void => {
    if (currentStep > 1) setCurrentStep(currentStep - 1)
  }

  const handleActivate = async (): Promise<void> => {
    if (!licenseKey.trim()) {
      toast.error(t('messages.enterKey'))
      return
    }

    setIsLoading(true)
    try {
      const result = await window.api.license.activate(licenseKey.trim())

      if (result && result.success === true) {
        markStepComplete(3)
        toast.success(t('messages.activationSuccess'))
        setTimeout(() => onActivated(), 800)
        return
      }

      if (result && result.success === false) {
        toast.error(result.message || t('messages.activationFailed'))
        return
      }

      console.error('Unexpected activation response:', result)
      toast.error(t('messages.activationError'))
    } catch (error) {
      console.error('Error activating license:', error)
      if (error instanceof Error) {
        if (error.message.includes('network') || error.message.includes('fetch')) {
          toast.error('Network error. Please check your internet connection.')
        } else if (error.message.includes('timeout')) {
          toast.error('Request timed out. Please try again.')
        } else {
          toast.error(`${t('messages.activationError')}: ${error.message}`)
        }
      } else {
        toast.error(t('messages.activationError'))
      }
    } finally {
      setIsLoading(false)
    }
  }

  const steps = [
    {
      number: 1,
      title: t('step1.title'),
      description: t('step1.description'),
      icon: Globe,
      content: (
        <div className="space-y-4 animate-slideIn">
          <div className="rounded-xl bg-gradient-to-br from-orange-500/10 to-amber-500/10 border border-orange-500/20 p-6">
            <p className="text-sm text-gray-300 mb-4">{t('step1.description')}</p>
            <Button
              onClick={handleOpenPortal}
              className="w-full bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-semibold shadow-lg shadow-orange-500/25 transition-all duration-300 hover:shadow-xl hover:shadow-orange-500/40 hover:scale-[1.02]"
              size="lg"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              {t('step1.button')}
            </Button>
          </div>
          <p className="text-xs text-gray-500 text-center">{ACTIVATION_PORTAL_URL}</p>
        </div>
      )
    },
    {
      number: 2,
      title: t('step2.title'),
      description: t('step2.description'),
      icon: KeyRound,
      content: (
        <div className="space-y-4 animate-slideIn">
          <div className="rounded-xl bg-gray-800/50 border border-gray-700 p-6">
            <p className="text-sm text-gray-300 mb-4">{t('step2.description')}</p>

            <div className="relative rounded-lg overflow-hidden bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 aspect-video flex items-center justify-center group">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-600/20 to-amber-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="text-center z-10">
                <KeyRound className="w-16 h-16 text-gray-600 mx-auto mb-3" />
                <p className="text-sm text-gray-500 font-medium">{t('step2.imageAlt')}</p>
              </div>
              <img
                src=""
                alt={t('step2.imageAlt')}
                className="absolute inset-0 w-full h-full object-contain hidden"
                id="license-screenshot"
              />
            </div>
          </div>

          <Button
            onClick={handleContinueToActivation}
            className="w-full bg-gray-700 hover:bg-gray-600 text-white font-semibold transition-all duration-300"
            size="lg"
          >
            {t('step3.title')}
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      )
    },
    {
      number: 3,
      title: t('step3.title'),
      description: t('step3.description'),
      icon: Check,
      content: (
        <div className="space-y-4 animate-slideIn">
          <div className="space-y-3">
            <Label htmlFor="license" className="text-sm font-semibold text-gray-200">
              {t('step3.inputLabel')}
            </Label>
            <Input
              id="license"
              placeholder={t('step3.inputPlaceholder')}
              value={licenseKey}
              onChange={(e) => setLicenseKey(e.target.value)}
              className="font-mono text-sm bg-gray-800 border-gray-600 text-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all duration-200"
              disabled={isLoading}
              onKeyDown={(e) => { if (e.key === 'Enter' && !isLoading) handleActivate() }}
            />
            <p className="text-xs text-gray-500">{t('step3.description')}</p>
          </div>

          <Button
            onClick={handleActivate}
            disabled={isLoading || !licenseKey.trim()}
            className="w-full bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-bold shadow-lg shadow-orange-500/25 transition-all duration-300 hover:shadow-xl hover:shadow-orange-500/40 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            size="lg"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {t('step3.activatingButton')}
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                {t('step3.activateButton')}
              </>
            )}
          </Button>
        </div>
      )
    }
  ]

  const currentStepData = steps[currentStep - 1]

  return (
    <>
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700;900&display=swap');

          @keyframes slideIn {
            from { opacity: 0; transform: translateY(10px); }
            to   { opacity: 1; transform: translateY(0); }
          }

          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50%       { opacity: 0.5; }
          }

          @keyframes checkmark {
            0%   { transform: scale(0) rotate(45deg); }
            50%  { transform: scale(1.2) rotate(45deg); }
            100% { transform: scale(1) rotate(45deg); }
          }

          .animate-slideIn { animation: slideIn 0.4s ease-out; }
          .animate-pulse   { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }

          .license-activation-dialog {
            font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          }

          .step-indicator { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
          .step-indicator.completed { background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-color: #10b981; }
          .step-indicator.active    { background: linear-gradient(135deg, #ea580c 0%, #f59e0b 100%); border-color: #ea580c; box-shadow: 0 0 0 4px rgba(234, 88, 12, 0.1); }
          .step-indicator.pending   { background: #1f2937; border-color: #374151; }

          .step-line           { transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1); }
          .step-line.completed { background: linear-gradient(to bottom, #10b981, #059669); }
        `}
      </style>

      <Dialog open={open} onOpenChange={() => {}}>
        <DialogContent
          className="license-activation-dialog bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 border-gray-700 text-white max-w-[700px] p-0 overflow-hidden"
          showCloseButton={false}
        >
          <div className="absolute top-4 ltr:right-4 rtl:left-4 z-10">
            <LanguageSelector />
          </div>

          <div className="relative bg-gradient-to-r from-orange-600 to-amber-600 px-8 py-6">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjAzIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-50" />
            <DialogHeader className="relative">
              <DialogTitle className="text-white text-3xl font-black tracking-tight bg-transparent p-0 m-0 ltr:pr-16 rtl:pl-16">
                {t('title')}
              </DialogTitle>
              <DialogDescription className="text-orange-100 text-base mt-2">
                {t('description')}
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="px-8 py-6">
            <div className="flex items-start justify-between mb-8 relative">
              {steps.map((step, index) => {
                const isCompleted = completedSteps.has(step.number)
                const isActive = currentStep === step.number
                const StepIcon = step.icon

                return (
                  <div key={step.number} className="flex-1 relative">
                    <div className="flex flex-col items-center">
                      <div
                        className={`step-indicator w-12 h-12 rounded-full flex items-center justify-center border-2 z-10 ${
                          isCompleted ? 'completed' : isActive ? 'active' : 'pending'
                        }`}
                      >
                        {isCompleted ? (
                          <Check className="w-6 h-6 text-white" />
                        ) : (
                          <StepIcon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-500'}`} />
                        )}
                      </div>
                      <div className="mt-3 text-center">
                        <p className={`text-xs font-bold ${isActive || isCompleted ? 'text-white' : 'text-gray-500'}`}>
                          {step.title}
                        </p>
                      </div>
                    </div>

                    {index < steps.length - 1 && (
                      <div
                        className={`step-line absolute top-6 left-[calc(50%+24px)] w-[calc(100%-48px)] h-0.5 ${
                          completedSteps.has(step.number) && completedSteps.has(step.number + 1)
                            ? 'completed'
                            : 'bg-gray-700'
                        }`}
                        style={{ transform: 'translateY(-50%)' }}
                      />
                    )}
                  </div>
                )
              })}
            </div>

            <div className="min-h-[280px]">
              <div className="mb-6">
                <h3 className="text-xl font-bold text-white mb-2">{currentStepData.title}</h3>
              </div>
              {currentStepData.content}
            </div>
          </div>

          <div className="bg-gray-800/50 px-8 py-4 border-t border-gray-700">
            <div className="flex items-center justify-between">
              {currentStep > 1 ? (
                <Button
                  onClick={handleStepBack}
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-4 h-4 ltr:mr-2 rtl:ml-2" />
                  <span className="text-sm">{t('navigation.back') || 'Back'}</span>
                </Button>
              ) : (
                <div></div>
              )}
              <p className="text-xs text-gray-400">Step {currentStep} of {steps.length}</p>
              <div className="w-20"></div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
