import { ReactNode } from 'react'
import {
  CalendarDays,
  CalendarRange,
  CreditCard,
  HardDrive,
  IdCard,
  LayoutDashboardIcon,
  MessageCircle,
  NotebookPen,
  Receipt,
  Repeat,
  ScanLine,
  Settings,
  ShoppingCart,
  SlidersHorizontal,
  Tag,
  UserCheck,
  UserCog,
  UserRound,
  Users
} from 'lucide-react'
import { PERMISSIONS } from '@renderer/models/account'

const IS_AIRGAPPED = import.meta.env.VITE_BUILD_VARIANT === 'airgapped'

export interface SubMenuItem {
  path: string
  label: string
  icon: ReactNode
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
  {
    icon: <Users />,
    label: 'nav.members',
    children: [
      {
        path: '/members',
        label: 'nav.memberInfo',
        icon: <UserRound />,
        permission: PERMISSIONS.members.view
      },
      { path: '/plans', label: 'nav.plans', icon: <Tag />, permission: PERMISSIONS.plans.view },
      {
        path: '/memberships',
        label: 'nav.memberships',
        icon: <CreditCard />,
        permission: PERMISSIONS.memberships.view
      },
      {
        path: '/checkin',
        label: 'nav.checkin',
        icon: <ScanLine />,
        permission: PERMISSIONS.checkins.view
      }
    ]
  },
  {
    icon: <CalendarDays />,
    label: 'nav.classes',
    permission: PERMISSIONS.classes.view,
    children: [
      { path: '/classes/rules', label: 'nav.classesRules', icon: <Repeat /> },
      { path: '/classes/schedule', label: 'nav.classesSchedule', icon: <CalendarRange /> },
      { path: '/classes/subscribers', label: 'nav.classesSubscribers', icon: <UserCheck /> }
    ]
  },
  {
    path: '/store',
    icon: <ShoppingCart />,
    label: 'nav.store',
    permission: PERMISSIONS.store.view
  },
  {
    path: '/billing',
    icon: <Receipt />,
    label: 'nav.billing',
    permission: PERMISSIONS.billing.view
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
    icon: <Settings />,
    label: 'nav.settings',
    permission: PERMISSIONS.settings.view,
    children: [
      { path: '/settings', label: 'nav.settingsGeneral', icon: <SlidersHorizontal /> },
      { path: '/settings/backup', label: 'nav.settingsBackup', icon: <HardDrive /> },
      ...(!IS_AIRGAPPED
        ? [{ path: '/settings/whatsapp', label: 'nav.settingsWhatsApp', icon: <MessageCircle /> }]
        : [])
    ]
  }
]
