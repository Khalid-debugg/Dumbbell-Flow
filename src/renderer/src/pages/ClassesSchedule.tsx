import { useAuth } from '@renderer/hooks/useAuth'
import { PERMISSIONS } from '@renderer/models/account'
import Schedule from '@renderer/components/classes/schedule/Schedule'

export default function ClassesSchedule() {
  const { hasPermission } = useAuth()

  if (!hasPermission(PERMISSIONS.classes.view)) return null

  return <Schedule />
}
