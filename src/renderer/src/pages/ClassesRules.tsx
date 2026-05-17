import { useEffect } from 'react'
import { useAuth } from '@renderer/hooks/useAuth'
import { PERMISSIONS } from '@renderer/models/account'
import RecurringRules from '@renderer/components/classes/rules/RecurringRules'

export default function ClassesRules() {
  const { hasPermission } = useAuth()

  useEffect(() => {
    window.electron.ipcRenderer.invoke('classes:processPastDue').catch(() => {})
  }, [])

  if (!hasPermission(PERMISSIONS.classes.view)) return null

  return <RecurringRules />
}
