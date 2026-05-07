import {
  BadgeCheck,
  CircleDollarSign,
  LayoutDashboardIcon,
  NotebookPen,
  Settings,
  ShoppingCart,
  SquareChartGantt,
  UserCog,
  Users
} from 'lucide-react'
import { PERMISSIONS } from '@renderer/models/account'

export const menuItems = [
  { path: '/', icon: <LayoutDashboardIcon />, label: 'nav.dashboard' },
  { path: '/members', icon: <Users />, label: 'nav.members', permission: PERMISSIONS.members.view },
  {
    path: '/plans',
    icon: <SquareChartGantt />,
    label: 'nav.plans',
    permission: PERMISSIONS.plans.view
  },
  {
    path: '/memberships',
    icon: <CircleDollarSign />,
    label: 'nav.memberships',
    permission: PERMISSIONS.memberships.view
  },
  {
    path: '/checkin',
    icon: <BadgeCheck />,
    label: 'nav.checkin',
    permission: PERMISSIONS.checkins.view
  },
  {
    path: '/store',
    icon: <ShoppingCart />,
    label: 'nav.store',
    permission: PERMISSIONS.store.view
  },
  {
    path: '/reports',
    icon: <NotebookPen />,
    label: 'nav.reports',
    permission: PERMISSIONS.reports.view
  },
  {
    path: '/accounts',
    icon: <UserCog />,
    label: 'nav.accounts',
    permission: PERMISSIONS.accounts.view
  },
  {
    path: '/settings',
    icon: <Settings />,
    label: 'nav.settings',
    permission: PERMISSIONS.settings.view
  }
]
