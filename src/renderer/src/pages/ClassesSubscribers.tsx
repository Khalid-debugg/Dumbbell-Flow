import { useAuth } from '@renderer/hooks/useAuth'
import { PERMISSIONS } from '@renderer/models/account'
import Subscribers from '@renderer/components/classes/subscribers/Subscribers'

export default function ClassesSubscribers() {
  const { hasPermission } = useAuth()

  if (!hasPermission(PERMISSIONS.classes.view)) return null

  return <Subscribers />
}
