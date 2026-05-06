import { createContext, useState, ReactNode, useCallback, useContext, useMemo } from 'react'
import { User } from '@renderer/models/account'
import { SettingsContext } from './SettingsContext'

export interface AuthContextType {
  user: User | null
  loading: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
  hasPermission: (permission: string) => boolean
  refreshUser: () => Promise<void>
}

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const settingsContext = useContext(SettingsContext)

  const login = useCallback(
    async (username: string, password: string) => {
      try {
        const loggedInUser = await window.electron.ipcRenderer.invoke(
          'accounts:login',
          username,
          password
        )
        setUser(loggedInUser)
        settingsContext?.initializeNotifications()
      } catch (error) {
        console.error('Login failed:', error)
        throw error
      }
    },
    [settingsContext?.initializeNotifications]
  )

  const logout = useCallback(async () => {
    setUser(null)
  }, [])

  const hasPermission = useCallback(
    (permission: string): boolean => {
      if (!user) return false
      if (user.isAdmin) return true
      return user.permissions[permission] === true
    },
    [user]
  )

  const refreshUser = useCallback(async () => {
    if (!user?.id) return
    try {
      const updatedUser = await window.electron.ipcRenderer.invoke('accounts:getById', user.id)
      if (updatedUser && updatedUser.isActive) {
        setUser(updatedUser)
      } else {
        await logout()
      }
    } catch (error) {
      console.error('Failed to refresh user:', error)
      await logout()
    }
  }, [user?.id, logout])

  const contextValue = useMemo(
    () => ({ user, loading: false, login, logout, hasPermission, refreshUser }),
    [user, login, logout, hasPermission, refreshUser]
  )

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}
