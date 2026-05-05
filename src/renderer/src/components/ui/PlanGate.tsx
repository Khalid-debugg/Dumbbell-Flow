import { Lock } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface PlanGateProps {
  children: React.ReactNode
  requiredPlan: 'pro' | 'premium'
  compact?: boolean
}

export function PlanGate({ children, requiredPlan, compact = false }: PlanGateProps) {
  const { t } = useTranslation('common')

  return (
    <div className="relative rounded-lg overflow-hidden">
      <div className="blur-sm pointer-events-none select-none">{children}</div>
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/70 rounded-lg">
        {compact ? (
          <Lock className="w-5 h-5 text-yellow-400" />
        ) : (
          <>
            <div className="w-16 h-16 bg-yellow-900/20 rounded-full flex items-center justify-center mb-4">
              <Lock className="w-8 h-8 text-yellow-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              {t(`planGate.${requiredPlan}.title`)}
            </h3>
            <p className="text-gray-400 text-center max-w-sm px-4">
              {t(`planGate.${requiredPlan}.description`)}
            </p>
          </>
        )}
      </div>
    </div>
  )
}
