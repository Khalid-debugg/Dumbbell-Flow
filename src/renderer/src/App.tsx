import { HashRouter, Routes, Route } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Layout from './components/Layout/Layout'
import { Toaster, toast } from 'sonner'
import { lazy, Suspense, useEffect, useState, useRef } from 'react'
import { LoaderCircle, AlertTriangle, X } from 'lucide-react'
import { SettingsProvider } from './contexts/SettingsContext'
import { AuthProvider } from './contexts/AuthContext'
import { LicenseActivation } from './components/license/LicenseActivation'
import { AirgappedActivation } from './components/license/AirgappedActivation'
import { useLicense } from './hooks/useLicense'
import { useAuth } from './hooks/useAuth'
import Login from './pages/Login'
import { ErrorBoundary } from './components/ErrorBoundary'
import { NotificationResultsDialog } from './components/settings/NotificationResultsDialog'

interface WhatsAppNotificationResult {
  memberName: string
  phoneNumber: string
  status: 'sent' | 'failed' | 'skipped'
  reason?: string
  daysLeft: number
}

interface WhatsAppDialogData {
  results: WhatsAppNotificationResult[]
  sentCount: number
  failedCount: number
  skippedCount: number
}

interface Notification {
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  description?: string
  translationKey?: string
  translationParams?: Record<string, string | number>
  whatsappResults?: WhatsAppDialogData
}

const IS_AIRGAPPED = import.meta.env.VITE_BUILD_VARIANT === 'airgapped'

const Dashboard = lazy(() => import('./pages/Dashboard'))
const Members = lazy(() => import('./pages/Members'))
const Memberships = lazy(() => import('./pages/Memberships'))
const Plans = lazy(() => import('./pages/Plans'))
const CheckIn = lazy(() => import('./pages/Checkin'))
const Reports = lazy(() => import('./pages/Reports'))
const Settings = lazy(() => import('./pages/Settings'))
const Accounts = lazy(() => import('./pages/Accounts'))
function AppContent() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-900">
        <LoaderCircle className="h-20 w-20 animate-spin text-yellow-500" />
      </div>
    )
  }

  if (!user) {
    return <Login />
  }

  return (
    <Layout>
      <Routes>
        <Route
          path="/"
          element={
            <Suspense fallback={<LoaderCircle className="mx-auto h-20 w-20 animate-spin" />}>
              <Dashboard />
            </Suspense>
          }
        />
        <Route
          path="/members"
          element={
            <Suspense fallback={<LoaderCircle className="mx-auto h-20 w-20 animate-spin" />}>
              <Members />
            </Suspense>
          }
        />
        <Route
          path="/plans"
          element={
            <Suspense fallback={<LoaderCircle className="mx-auto h-20 w-20 animate-spin" />}>
              <Plans />
            </Suspense>
          }
        />
        <Route
          path="/memberships"
          element={
            <Suspense fallback={<LoaderCircle className="mx-auto h-20 w-20 animate-spin" />}>
              <Memberships />
            </Suspense>
          }
        />
        <Route
          path="/checkin"
          element={
            <Suspense fallback={<LoaderCircle className="mx-auto h-20 w-20 animate-spin" />}>
              <CheckIn />
            </Suspense>
          }
        />
        <Route
          path="/reports"
          element={
            <Suspense fallback={<LoaderCircle className="mx-auto h-20 w-20 animate-spin" />}>
              <Reports />
            </Suspense>
          }
        />
        <Route
          path="/accounts"
          element={
            <Suspense fallback={<LoaderCircle className="mx-auto h-20 w-20 animate-spin" />}>
              <Accounts />
            </Suspense>
          }
        />
        <Route
          path="/settings"
          element={
            <ErrorBoundary>
              <Suspense fallback={<LoaderCircle className="mx-auto h-20 w-20 animate-spin" />}>
                <Settings />
              </Suspense>
            </ErrorBoundary>
          }
        />
      </Routes>
    </Layout>
  )
}

function App() {
  const { i18n, t } = useTranslation(['settings', 'common', 'license'])
  const { isLicensed, isExpired, daysRemaining, isCheckingLicense, setIsLicensed } = useLicense()
  const [bannerDismissed, setBannerDismissed] = useState(false)
  const [showRenewalModal, setShowRenewalModal] = useState(false)
  const [showWhatsAppDialog, setShowWhatsAppDialog] = useState(false)
  const [whatsAppDialogData, setWhatsAppDialogData] = useState<WhatsAppDialogData>({
    results: [],
    sentCount: 0,
    failedCount: 0,
    skippedCount: 0
  })
  const notificationListenerInitialized = useRef(false)

  document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr'

  useEffect(() => {
    if (notificationListenerInitialized.current) {
      return
    }
    notificationListenerInitialized.current = true
    const handleNotification = (_event: unknown, notification: Notification) => {
      const title = notification.translationKey
        ? t(notification.translationKey, notification.translationParams || {})
        : notification.title

      const description =
        notification.description?.startsWith('settings:') ||
        notification.description?.startsWith('common:')
          ? t(notification.description, notification.translationParams || {})
          : notification.description

      if (notification.whatsappResults) {
        setWhatsAppDialogData(notification.whatsappResults)

        toast.success(title, {
          description,
          action: {
            label: t('settings:whatsapp.toasts.showDetails'),
            onClick: () => setShowWhatsAppDialog(true)
          }
        })
        return
      }

      switch (notification.type) {
        case 'success':
          toast.success(title, { description })
          break
        case 'error':
          toast.error(title, { description })
          break
        case 'warning':
          toast.warning(title, { description })
          break
        case 'info':
          toast.info(title, { description })
          break
      }
    }

    window.electron.ipcRenderer.on('show-notification', handleNotification)

    return () => {
      window.electron.ipcRenderer.removeListener('show-notification', handleNotification)
    }
  }, [t])

  const handleActivated = (): void => {
    setIsLicensed(true)
  }

  if (isCheckingLicense) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <LoaderCircle className="h-20 w-20 animate-spin text-gray-700" />
      </div>
    )
  }

  if (!isLicensed && isExpired) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-gray-50 p-8 text-center">
        <Toaster />
        <div className="max-w-md">
          <div className="mb-4 flex justify-center">
            <AlertTriangle className="h-16 w-16 text-amber-500" />
          </div>
          <h1 className="mb-2 text-2xl font-bold text-gray-900">{t('license:expired.title')}</h1>
          <p className="mb-8 text-gray-500">{t('license:expired.description')}</p>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <a
              href={`${import.meta.env.VITE_ACTIVATION_PORTAL_URL ?? 'https://dumbbellflow.com'}#pricing`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg bg-amber-500 px-6 py-3 font-semibold text-white hover:bg-amber-600 transition-colors"
            >
              {t('license:expired.subscribeButton')}
            </a>
            <button
              onClick={() => window.api.license.deactivate?.().then(() => window.location.reload())}
              className="rounded-lg border border-gray-300 px-6 py-3 font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
            >
              {t('license:expired.deactivateButton')}
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!isLicensed) {
    return (
      <div className="h-screen bg-gray-50">
        <Toaster />
        <LicenseActivation open={true} onActivated={handleActivated} />
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <HashRouter>
        <SettingsProvider>
          <AuthProvider>
            {IS_AIRGAPPED
              ? daysRemaining > 0 && daysRemaining <= 30 && !bannerDismissed && (
                  <div className="fixed bottom-4 end-4 z-50 w-80 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl">
                    <div className="h-1 w-full bg-amber-400" />
                    <div className="flex items-start gap-3 p-4">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-50">
                        <AlertTriangle className="h-5 w-5 text-amber-500" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-gray-900">
                          {t('license:offlineExpiry.message', { count: daysRemaining })}
                        </p>
                        <button
                          onClick={() => setShowRenewalModal(true)}
                          className="mt-2 inline-block rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-amber-600"
                        >
                          {t('license:airgapped.activateButton')}
                        </button>
                      </div>
                      <button
                        onClick={() => setBannerDismissed(true)}
                        className="shrink-0 rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )
              : daysRemaining > 0 && daysRemaining <= 7 && !bannerDismissed && (
                  <div className="fixed bottom-4 end-4 z-50 w-80 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl">
                    <div className="h-1 w-full bg-amber-400" />
                    <div className="flex items-start gap-3 p-4">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-50">
                        <AlertTriangle className="h-5 w-5 text-amber-500" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-gray-900">
                          {t('license:trialBanner.message', { count: daysRemaining })}
                        </p>
                        <a
                          href={`${import.meta.env.VITE_ACTIVATION_PORTAL_URL ?? 'https://dumbbellflow.com'}#pricing`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 inline-block rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-amber-600"
                        >
                          {t('license:trialBanner.subscribe')}
                        </a>
                      </div>
                      <button
                        onClick={() => setBannerDismissed(true)}
                        className="shrink-0 rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
            <Toaster
              toastOptions={{
                classNames: {
                  toast: 'text-white!',
                  success: 'bg-green-600!',
                  error: 'bg-red-600!',
                  warning: 'bg-yellow-800! text-black!',
                  info: 'bg-blue-600!'
                }
              }}
            />
            <AppContent />
            {IS_AIRGAPPED && (
              <AirgappedActivation
                open={showRenewalModal}
                onActivated={() => window.location.reload()}
                onClose={() => setShowRenewalModal(false)}
              />
            )}
            {/* Global WhatsApp notification results dialog */}
            <NotificationResultsDialog
              open={showWhatsAppDialog}
              onOpenChange={setShowWhatsAppDialog}
              results={whatsAppDialogData.results}
              sentCount={whatsAppDialogData.sentCount}
              failedCount={whatsAppDialogData.failedCount}
              skippedCount={whatsAppDialogData.skippedCount}
            />
          </AuthProvider>
        </SettingsProvider>
      </HashRouter>
    </ErrorBoundary>
  )
}

export default App
