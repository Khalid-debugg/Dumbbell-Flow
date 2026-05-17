import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useState, useEffect } from 'react'
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  Languages,
  ShieldUser,
  LogOut
} from 'lucide-react'
import { Button } from '../ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '../ui/dropdown-menu'
import { useSettings } from '@renderer/hooks/useSettings'
import { useAuth } from '@renderer/hooks/useAuth'
import { menuItems } from './constants'
import { toast } from 'sonner'
import type { SupportedLanguage } from '@renderer/locales/i18n'

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const { settings, updateSettings } = useSettings()
  const { user, logout, hasPermission } = useAuth()
  const { t, i18n } = useTranslation()
  const [collapsed, setCollapsed] = useState(false)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => {
    const initial = new Set<string>()
    for (const item of menuItems) {
      if (item.children?.some((c) => location.pathname.startsWith(c.path))) {
        initial.add(item.label)
      }
    }
    return initial
  })

  useEffect(() => {
    for (const item of menuItems) {
      if (item.children?.some((c) => location.pathname.startsWith(c.path))) {
        setExpandedGroups((prev) => {
          if (prev.has(item.label)) return prev
          const next = new Set(prev)
          next.add(item.label)
          return next
        })
      }
    }
  }, [location.pathname])

  const toggleGroup = (label: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(label)) next.delete(label)
      else next.add(label)
      return next
    })
  }

  // Filter menu items based on user permissions
  const visibleMenuItems = menuItems.filter((item) => {
    // Dashboard is always visible
    if (!item.permission) return true
    // Check if user has permission for this menu item
    return hasPermission(item.permission)
  })

  const languages: { code: SupportedLanguage; label: string }[] = [
    { code: 'ar', label: 'العربية' },
    { code: 'en', label: 'English' },
    { code: 'es', label: 'Español' },
    { code: 'pt', label: 'Português' },
    { code: 'fr', label: 'Français' },
    { code: 'de', label: 'Deutsch' }
  ]

  const changeLanguage = (langCode: SupportedLanguage) => {
    i18n.changeLanguage(langCode)
    document.documentElement.dir = langCode === 'ar' ? 'rtl' : 'ltr'
    updateSettings({ ...settings!, language: langCode })
  }

  const handleLogout = async () => {
    try {
      await logout()
      toast.success(t('user.logoutSuccess'))
    } catch (error) {
      console.error('Logout failed:', error)
      toast.error(t('user.logoutFailed'))
    }
  }

  const isRTL = i18n.language === 'ar'

  return (
    <div className="flex h-screen bg-gray-900 text-white" dir={isRTL ? 'rtl' : 'ltr'}>
      <aside
        className={`relative bg-gray-800 border-r border-gray-700 flex flex-col transition-[width] duration-300 ease-in-out ${
          collapsed ? 'w-20' : 'w-64'
        }`}
      >
        <Button
          onClick={() => setCollapsed(!collapsed)}
          className={`absolute top-6 z-10 w-10 h-10 p-0 rounded-full
            bg-gradient-to-br from-gray-700/80 to-gray-800/80 backdrop-blur-sm
            border border-gray-600/50 shadow-lg
            hover:from-yellow-600/80 hover:to-orange-600/80 hover:border-yellow-500/50
            hover:shadow-yellow-500/20 hover:shadow-xl hover:scale-110
            active:scale-95
            transition-all duration-300 ease-in-out
            ${isRTL ? '-left-5' : '-right-5'}
          `}
        >
          <div className="transition-transform duration-300 ease-in-out">
            {isRTL ? (
              collapsed ? (
                <ChevronLeft className="w-5 h-5" />
              ) : (
                <ChevronRight className="w-5 h-5" />
              )
            ) : collapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <ChevronLeft className="w-5 h-5" />
            )}
          </div>
        </Button>

        <div
          className={`border-b border-gray-700/50 flex items-center relative overflow-hidden group transition-all duration-300 ${
            collapsed ? 'pt-20 pb-8 px-3 justify-center' : 'py-8 px-6 gap-3'
          }`}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-600/5 via-orange-600/5 to-red-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          <div className="relative flex items-center justify-center transition-all duration-300">
            <div
              className={`absolute inset-0 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-300 ${
                collapsed ? '' : 'animate-pulse'
              }`}
            />
            <div
              className={`relative rounded-xl bg-gradient-to-br from-yellow-500 via-orange-500 to-red-500 shadow-lg shadow-yellow-500/20 group-hover:shadow-yellow-500/30 group-hover:scale-110 transition-all duration-300 ring-2 ring-yellow-400/10 group-hover:ring-yellow-400/20 ${
                collapsed ? 'w-12 h-12 p-2.5' : 'w-12 h-12 p-2.5'
              }`}
            >
              <Dumbbell className="w-full h-full text-white drop-shadow-lg group-hover:rotate-12 transition-transform duration-300" />
            </div>
          </div>

          {!collapsed && (
            <div className="relative flex-1 transition-all duration-300">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 bg-clip-text text-transparent drop-shadow-sm group-hover:from-yellow-300 group-hover:via-orange-300 group-hover:to-red-300 transition-all duration-300">
                {t('app.name')}
              </h1>
              <p className="text-xs text-gray-400 mt-0.5 group-hover:text-gray-300 transition-colors duration-300 font-medium">
                {t('app.tagline')}
              </p>
            </div>
          )}

          {!collapsed && (
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          )}
        </div>

        <nav
          className={`flex-1 space-y-[0.5vh] overflow-y-auto ${collapsed ? 'px-2 py-4' : 'p-4'}`}
        >
          {visibleMenuItems.map((item) => {
            if (item.children) {
              const visibleChildren = item.children.filter(
                (c) => !c.permission || hasPermission(c.permission)
              )
              if (visibleChildren.length === 0) return null
              const isGroupActive = visibleChildren.some((c) =>
                location.pathname.startsWith(c.path)
              )
              const isExpanded = expandedGroups.has(item.label)
              const activeGradient =
                'bg-gradient-to-r from-yellow-600 to-orange-600 text-white shadow-lg shadow-yellow-500/20'
              const inactiveHover =
                'text-gray-300 hover:bg-gray-700/50 hover:text-white hover:shadow-md'

              const collapsedGroupIcon = (
                <div
                  className={`
                    relative flex items-center justify-center w-8 h-8 rounded-lg
                    transition-all duration-300 ease-in-out
                    ${isGroupActive ? 'bg-white/20 shadow-lg shadow-white/20' : 'group-hover:bg-yellow-500/10 group-hover:shadow-md group-hover:shadow-yellow-500/20'}
                  `}
                >
                  <span
                    className={`
                      text-lg transition-all duration-300 ease-in-out
                      ${isGroupActive ? 'scale-110 drop-shadow-[0_0_8px_rgba(255,255,255,0.6)] animate-pulse' : 'group-hover:scale-125 group-hover:drop-shadow-[0_0_6px_rgba(251,191,36,0.8)]'}
                    `}
                  >
                    {item.icon}
                  </span>
                  <div
                    className={`
                      absolute inset-0 rounded-lg transition-all duration-300
                      ${isGroupActive ? 'ring-2 ring-white/40 ring-offset-2 ring-offset-yellow-600/50' : 'group-hover:ring-2 group-hover:ring-yellow-400/40'}
                    `}
                  />
                </div>
              )

              const groupIcon = (
                <div className="relative flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-300 ease-in-out group-hover:bg-yellow-500/10 group-hover:shadow-md group-hover:shadow-yellow-500/20">
                  <span className="text-lg transition-all duration-300 ease-in-out group-hover:scale-125 group-hover:drop-shadow-[0_0_6px_rgba(251,191,36,0.8)]">
                    {item.icon}
                  </span>
                  <div className="absolute inset-0 rounded-lg transition-all duration-300 group-hover:ring-2 group-hover:ring-yellow-400/40" />
                </div>
              )

              if (collapsed) {
                return (
                  <Link
                    key={item.label}
                    to={visibleChildren[0].path}
                    className={`
                      flex items-center rounded-lg transition-all duration-300 ease-in-out
                      group relative overflow-hidden min-h-[2.5rem] p-3 justify-center
                      ${isGroupActive ? activeGradient : inactiveHover}
                    `}
                  >
                    {collapsedGroupIcon}
                    {isGroupActive && (
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
                    )}
                  </Link>
                )
              }

              return (
                <div key={item.label}>
                  <button
                    onClick={() => toggleGroup(item.label)}
                    className={`
                      w-full flex items-center rounded-lg transition-all duration-300 ease-in-out
                      group relative overflow-hidden min-h-[2.5rem] gap-2.5 px-3 py-[1vh]
                      ${inactiveHover}
                    `}
                  >
                    {groupIcon}
                    <span className="font-medium text-sm flex-1 text-start transition-all duration-300">
                      {t(item.label)}
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                    />
                  </button>
                  {isExpanded && (
                    <div className="mt-1 ms-3 space-y-[0.5vh]">
                      {visibleChildren.map((child) => {
                        const isChildActive = location.pathname === child.path
                        return (
                          <Link
                            key={child.path}
                            to={child.path}
                            className={`
                              flex items-center rounded-lg
                              group relative overflow-hidden
                              min-h-[2.5rem] gap-2.5 px-3 py-[1vh]
                              transition-all duration-300 ease-in-out
                              ${isChildActive ? activeGradient : 'text-gray-300 hover:bg-gray-700/50 hover:text-white hover:shadow-md hover:translate-x-1'}
                            `}
                          >
                            <div
                              className={`
                                relative flex items-center justify-center w-8 h-8 rounded-lg
                                transition-all duration-300 ease-in-out
                                ${isChildActive ? 'bg-white/20 shadow-lg shadow-white/20' : 'group-hover:bg-yellow-500/10 group-hover:shadow-md group-hover:shadow-yellow-500/20'}
                              `}
                            >
                              <span
                                className={`
                                  text-lg transition-all duration-300 ease-in-out
                                  ${isChildActive ? 'scale-110 drop-shadow-[0_0_8px_rgba(255,255,255,0.6)] animate-pulse' : 'group-hover:scale-125 group-hover:drop-shadow-[0_0_6px_rgba(251,191,36,0.8)]'}
                                `}
                              >
                                {child.icon}
                              </span>
                              <div
                                className={`
                                  absolute inset-0 rounded-lg transition-all duration-300
                                  ${isChildActive ? 'ring-2 ring-white/40 ring-offset-2 ring-offset-yellow-600/50' : 'group-hover:ring-2 group-hover:ring-yellow-400/40'}
                                `}
                              />
                            </div>
                            <span className="font-medium text-sm transition-all duration-300">
                              {t(child.label)}
                            </span>
                            {isChildActive && (
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
                            )}
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            }

            const isActive = location?.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path!}
                className={`
                  flex items-center rounded-lg
                  group relative overflow-hidden
                  min-h-[2.5rem]  p-3
                  ${collapsed ? 'justify-center' : 'gap-2.5 px-3 py-[1vh]'}
                  ${
                    isActive
                      ? 'bg-gradient-to-r from-yellow-600 to-orange-600 text-white shadow-lg shadow-yellow-500/20'
                      : 'text-gray-300 hover:bg-gray-700/50 hover:text-white hover:shadow-md hover:translate-x-1'
                  }
                `}
              >
                <div
                  className={`
                  relative flex items-center justify-center w-8 h-8 rounded-lg
                  transition-all duration-300 ease-in-out
                  ${
                    isActive
                      ? 'bg-white/20 shadow-lg shadow-white/20'
                      : 'group-hover:bg-yellow-500/10 group-hover:shadow-md group-hover:shadow-yellow-500/20'
                  }
                `}
                >
                  <span
                    className={`
                    text-lg transition-all duration-300 ease-in-out
                    ${
                      isActive
                        ? 'scale-110 drop-shadow-[0_0_8px_rgba(255,255,255,0.6)] animate-pulse'
                        : 'group-hover:scale-125 group-hover:drop-shadow-[0_0_6px_rgba(251,191,36,0.8)]'
                    }
                  `}
                  >
                    {item.icon}
                  </span>
                  <div
                    className={`
                    absolute inset-0 rounded-lg
                    transition-all duration-300
                    ${
                      isActive
                        ? 'ring-2 ring-white/40 ring-offset-2 ring-offset-yellow-600/50'
                        : 'group-hover:ring-2 group-hover:ring-yellow-400/40'
                    }
                  `}
                  />
                </div>

                {!collapsed && (
                  <span className="font-medium text-sm transition-all duration-300">
                    {t(item.label)}
                  </span>
                )}
                {isActive && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
                )}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-gray-700 space-y-[1vh]">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="default"
                className="w-full group relative overflow-hidden
                  bg-gradient-to-br from-gray-700 to-gray-800
                  hover:from-yellow-600 hover:to-orange-600
                  border border-gray-600/50
                  hover:border-yellow-500/50
                  shadow-md hover:shadow-lg hover:shadow-yellow-500/10
                  rounded-lg px-4
                  min-h-[2.5rem] h-[4.5vh] max-h-[3rem]
                  transition-all duration-300 ease-in-out
                  hover:scale-105 active:scale-95
                "
              >
                <div className="flex items-center justify-center gap-2 relative z-10">
                  <span className="text-lg transition-transform duration-300 group-hover:rotate-12">
                    <Languages />
                  </span>
                  {!collapsed && (
                    <span className="font-medium text-sm">
                      {languages.find((l) => l.code === i18n.language)?.label || 'English'}
                    </span>
                  )}
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="bg-gray-800 border-gray-700 text-white min-w-[160px]"
            >
              {languages.map((lang) => (
                <DropdownMenuItem
                  key={lang.code}
                  onClick={() => changeLanguage(lang.code)}
                  className={`cursor-pointer hover:bg-gray-700 focus:bg-gray-700 ${
                    i18n.language === lang.code ? 'bg-yellow-600/20 text-yellow-400' : ''
                  }`}
                >
                  {lang.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="space-y-[0.5vh]">
            <div
              className={`
                group flex items-center ${collapsed ? 'justify-center' : 'gap-3 px-3'}
                rounded-lg cursor-pointer
                transition-all duration-300 ease-in-out
                hover:bg-gray-700/50
                relative overflow-hidden
                min-h-[3rem] 
              `}
            >
              <div className="relative">
                <div
                  className="
                  min-w-[2.5rem] min-h-[2.5rem] w-[4vh] h-[4vh] max-w-[3rem] max-h-[3rem] rounded-full
                  bg-linear-to-r from-yellow-500 to-orange-500
                  flex items-center justify-center
                  shadow-lg shadow-yellow-500/20
                  ring-2 ring-gray-700
                  group-hover:ring-yellow-400/30
                  group-hover:shadow-yellow-500/30
                  group-hover:scale-110
                  transition-all duration-300 ease-in-out
                "
                >
                  <span className="text-lg text-white transition-transform duration-300 group-hover:scale-110">
                    <ShieldUser className="w-5 h-5" />
                  </span>
                </div>
                <div
                  className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-gray-800
                  group-hover:scale-110 transition-transform duration-300
                  shadow-lg shadow-green-500/50
                "
                />
              </div>

              {!collapsed && (
                <div className="transition-all duration-300 flex-1">
                  <p className="font-semibold text-white group-hover:text-yellow-400 transition-colors duration-300">
                    {user?.fullName || t('user.admin')}
                  </p>
                  <p className="text-xs text-gray-400 group-hover:text-gray-300 transition-colors duration-300">
                    {user?.isAdmin ? t('user.administrator') : t('user.user')}
                  </p>
                </div>
              )}

              <div className="absolute inset-0 bg-gradient-to-r from-yellow-600/0 via-orange-600/5 to-yellow-600/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            </div>

            <Button
              onClick={handleLogout}
              variant="ghost"
              className="w-full group relative overflow-hidden
                text-gray-400 hover:text-red-400 hover:bg-red-500/10
                border border-transparent hover:border-red-500/30
                rounded-lg px-4
                min-h-[2.5rem] h-[4.5vh] max-h-[3rem]
                transition-all duration-300 ease-in-out
                hover:scale-105 active:scale-95
              "
            >
              <div className="flex items-center justify-center gap-2 relative z-10">
                <span className="text-lg transition-transform duration-300 group-hover:-translate-x-1">
                  <LogOut className="w-4 h-4" />
                </span>
                {!collapsed && <span className="font-medium text-sm">{t('user.logout')}</span>}
              </div>
            </Button>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto p-8">{children}</div>
      </main>
    </div>
  )
}
