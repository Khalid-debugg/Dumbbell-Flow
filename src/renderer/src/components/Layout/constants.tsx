import { ReactNode } from 'react'
import {
  BadgeCheck,
  CalendarDays,
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

export interface SubMenuItem {
  path: string
  label: string
  permission?: string
}

export interface MenuItem {
  path?: string
  icon: ReactNode
  label: string
  permission?: string
  children?: SubMenuItem[]
}

export const menuItems: MenuItem[] = [
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
    icon: <CalendarDays />,
    label: 'nav.classes',
    permission: PERMISSIONS.classes.view,
    children: [
      { path: '/classes/rules', label: 'nav.classesRules' },
      { path: '/classes/schedule', label: 'nav.classesSchedule' },
      { path: '/classes/subscribers', label: 'nav.classesSubscribers' }
    ]
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
