// Permission definitions organized by page
export const PERMISSIONS = {
  dashboard: {
    view_financial: 'dashboard.view_financial'
  },
  members: {
    view: 'members.view',
    create: 'members.create',
    edit: 'members.edit',
    delete: 'members.delete',
    view_details: 'members.view_details'
  },
  memberships: {
    view: 'memberships.view',
    create: 'memberships.create',
    edit: 'memberships.edit',
    delete: 'memberships.delete',
    view_details: 'memberships.view_details',
    extend: 'memberships.extend',
    view_payments: 'memberships.view_payments',
    add_payment: 'memberships.add_payment',
    complete_payment: 'memberships.complete_payment',
    modify_price: 'memberships.modify_price'
  },
  plans: {
    view: 'plans.view',
    create: 'plans.create',
    edit: 'plans.edit',
    delete: 'plans.delete'
  },
  checkins: {
    view: 'checkins.view',
    create: 'checkins.create',
    delete: 'checkins.delete'
  },
  reports: {
    generate: 'reports.generate',
    view: 'reports.view',
    save: 'reports.save',
    delete: 'reports.delete',
    export: 'reports.export'
  },
  settings: {
    view: 'settings.view',
    edit: 'settings.edit',
    manage_backups: 'settings.manage_backups',
    manage_license: 'settings.manage_license',
    manage_whatsapp: 'settings.manage_whatsapp'
  },
  accounts: {
    view: 'accounts.view',
    create: 'accounts.create',
    edit: 'accounts.edit',
    delete: 'accounts.delete',
    manage_permissions: 'accounts.manage_permissions',
    change_password: 'accounts.change_password',
    manage_admin: 'accounts.manage_admin'
  },
  store: {
    view: 'store.view',
    create_sale: 'store.create_sale',
    view_sales: 'store.view_sales',
    delete_sale: 'store.delete_sale',
    manage_products: 'store.manage_products'
  }
} as const

// Flatten all permissions into a single array
const ALL_PERMISSIONS = Object.values(PERMISSIONS).flatMap((page) => Object.values(page))

// Permission labels for UI display
export const PERMISSION_LABELS: Record<string, string> = {
  // Dashboard
  'dashboard.view_financial': 'Can view financial data',

  // Members
  'members.view': 'Can view members list',
  'members.create': 'Can create members',
  'members.edit': 'Can edit members',
  'members.delete': 'Can delete members',
  'members.view_details': 'Can view member details',

  // Memberships
  'memberships.view': 'Can view memberships list',
  'memberships.create': 'Can create memberships',
  'memberships.edit': 'Can edit memberships',
  'memberships.delete': 'Can delete memberships',
  'memberships.view_details': 'Can view membership details',
  'memberships.extend': 'Can extend memberships',
  'memberships.view_payments': 'Can view payment history',
  'memberships.add_payment': 'Can add payments',
  'memberships.complete_payment': 'Can complete scheduled payments',
  'memberships.modify_price': 'Can modify membership prices',

  // Plans
  'plans.view': 'Can view plans list',
  'plans.create': 'Can create plans',
  'plans.edit': 'Can edit plans',
  'plans.delete': 'Can delete plans',

  // Check-ins
  'checkins.view': 'Can view check-ins list',
  'checkins.create': 'Can perform check-ins',
  'checkins.delete': 'Can delete check-ins',

  // Reports
  'reports.generate': 'Can generate reports',
  'reports.view': 'Can view reports',
  'reports.save': 'Can save/download reports',
  'reports.delete': 'Can delete reports',
  'reports.export': 'Can export data to CSV',

  // Settings
  'settings.view': 'Can view settings',
  'settings.edit': 'Can edit settings',
  'settings.manage_backups': 'Can manage backups',
  'settings.manage_license': 'Can manage license activation',
  'settings.manage_whatsapp': 'Can manage WhatsApp notifications',

  // Accounts
  'accounts.view': 'Can view user accounts',
  'accounts.create': 'Can create user accounts',
  'accounts.edit': 'Can edit user accounts',
  'accounts.delete': 'Can delete user accounts',
  'accounts.manage_permissions': 'Can manage permissions',
  'accounts.change_password': 'Can change passwords',
  'accounts.manage_admin': 'Can manage admin status',

  // Store
  'store.view': 'Can access the store',
  'store.create_sale': 'Can create sales (POS)',
  'store.view_sales': 'Can view sales history',
  'store.delete_sale': 'Can delete sales records',
  'store.manage_products': 'Can add, edit, and remove products'
}

// Permission dependencies - maps each permission to the permissions it requires
export const PERMISSION_DEPENDENCIES: Record<string, string[]> = {
  // Members
  'members.edit': ['members.view'],
  'members.delete': ['members.view'],
  'members.view_details': ['members.view'],

  // Memberships
  'memberships.create': ['memberships.view'],
  'memberships.edit': ['memberships.view'],
  'memberships.delete': ['memberships.view'],
  'memberships.view_details': ['memberships.view'],
  'memberships.extend': ['memberships.view', 'memberships.view_details'],
  'memberships.view_payments': ['memberships.view', 'memberships.view_details'],
  'memberships.add_payment': [
    'memberships.view',
    'memberships.view_details',
    'memberships.view_payments'
  ],
  'memberships.complete_payment': [
    'memberships.view',
    'memberships.view_details',
    'memberships.view_payments'
  ],
  'memberships.modify_price': ['memberships.view', 'memberships.edit'],

  // Plans
  'plans.create': ['plans.view'],
  'plans.edit': ['plans.view'],
  'plans.delete': ['plans.view'],

  // Check-ins
  'checkins.create': ['checkins.view'],
  'checkins.delete': ['checkins.view'],

  // Reports
  'reports.save': ['reports.view'],
  'reports.delete': ['reports.view'],
  'reports.export': ['reports.view'],

  // Settings
  'settings.edit': ['settings.view'],
  'settings.manage_backups': ['settings.view'],
  'settings.manage_license': ['settings.view'],
  'settings.manage_whatsapp': ['settings.view'],

  // Accounts
  'accounts.create': ['accounts.view'],
  'accounts.edit': ['accounts.view'],
  'accounts.delete': ['accounts.view'],
  'accounts.manage_permissions': ['accounts.view', 'accounts.edit'],
  'accounts.change_password': ['accounts.view', 'accounts.edit'],
  'accounts.manage_admin': ['accounts.view', 'accounts.edit'],

  // Store
  'store.create_sale': ['store.view'],
  'store.view_sales': ['store.view'],
  'store.delete_sale': ['store.view', 'store.view_sales'],
  'store.manage_products': ['store.view']
}

// Page names for grouping
export const PAGE_NAMES: Record<string, string> = {
  dashboard: 'Dashboard',
  members: 'Members',
  memberships: 'Memberships',
  plans: 'Plans',
  checkins: 'Check-ins',
  reports: 'Reports',
  settings: 'Settings',
  accounts: 'Accounts',
  store: 'Store'
}

// User permissions type
export type UserPermissions = Record<string, boolean>

// User roles
export type UserRole = 'admin' | 'manager' | 'coach' | 'receptionist' | 'custom'

export type User = {
  id?: string
  username: string
  fullName: string
  password?: string
  email: string | null
  isAdmin: boolean
  isActive: boolean
  role?: UserRole
  permissions: UserPermissions
  lastLogin?: string | null
  createdAt?: string
  updatedAt?: string
}

export type UserDbRow = {
  id: string
  username: string
  password_hash: string
  full_name: string
  email: string | null
  is_admin: number
  is_active: number
  permissions: string
  last_login: string | null
  created_at: string
  updated_at: string
}

export interface UserFilters {
  query: string
  role: 'all' | 'admin' | 'manager' | 'coach' | 'receptionist' | 'custom'
  status: 'all' | 'active' | 'inactive'
}

export const DEFAULT_FILTERS: UserFilters = {
  query: '',
  role: 'all',
  status: 'all'
}

// Helper function to get all permissions as an object with all set to true
export function getAllPermissionsEnabled(): UserPermissions {
  const permissions: UserPermissions = {}
  ALL_PERMISSIONS.forEach((permission) => {
    permissions[permission] = true
  })
  return permissions
}

// Helper function to get empty permissions
export function getEmptyPermissions(): UserPermissions {
  const permissions: UserPermissions = {}
  ALL_PERMISSIONS.forEach((permission) => {
    permissions[permission] = false
  })
  return permissions
}

// Role definitions with predefined permissions
const ROLE_PERMISSIONS: Record<UserRole, UserPermissions> = {
  admin: getAllPermissionsEnabled(),

  manager: {
    // Dashboard
    'dashboard.view_financial': true,

    // Members - Full access
    ...Object.fromEntries(Object.values(PERMISSIONS.members).map((p) => [p, true])),

    // Memberships - Full access
    ...Object.fromEntries(Object.values(PERMISSIONS.memberships).map((p) => [p, true])),

    // Plans - Full access
    ...Object.fromEntries(Object.values(PERMISSIONS.plans).map((p) => [p, true])),

    // Check-ins - Full access
    ...Object.fromEntries(Object.values(PERMISSIONS.checkins).map((p) => [p, true])),

    // Reports - Full access
    ...Object.fromEntries(Object.values(PERMISSIONS.reports).map((p) => [p, true])),

    // Settings - View only (no edit or backups)
    'settings.view': true,
    'settings.edit': false,
    'settings.manage_backups': false,
    'settings.manage_license': false,

    // Accounts - View and create only (no delete, edit permissions, or admin management)
    'accounts.view': true,
    'accounts.create': true,
    'accounts.edit': false,
    'accounts.delete': false,
    'accounts.manage_permissions': false,
    'accounts.change_password': false,
    'accounts.manage_admin': false,

    // Store - Full access
    ...Object.fromEntries(Object.values(PERMISSIONS.store).map((p) => [p, true]))
  },

  coach: {
    // Dashboard
    'dashboard.view_financial': false,

    // Members - Full access
    ...Object.fromEntries(Object.values(PERMISSIONS.members).map((p) => [p, true])),

    // Memberships - View, create, edit, and extend (no delete or price modification)
    'memberships.view': true,
    'memberships.create': true,
    'memberships.edit': true,
    'memberships.delete': false,
    'memberships.view_details': true,
    'memberships.extend': true,
    'memberships.view_payments': true,
    'memberships.add_payment': true,
    'memberships.complete_payment': true,
    'memberships.modify_price': false,

    // Plans - Full access
    ...Object.fromEntries(Object.values(PERMISSIONS.plans).map((p) => [p, true])),

    // Check-ins - Full access
    ...Object.fromEntries(Object.values(PERMISSIONS.checkins).map((p) => [p, true])),

    // Reports - View and generate only
    'reports.generate': true,
    'reports.view': true,
    'reports.save': true,
    'reports.delete': false,
    'reports.export': true,

    // Settings - No access
    ...Object.fromEntries(Object.values(PERMISSIONS.settings).map((p) => [p, false])),

    // Accounts - No access
    ...Object.fromEntries(Object.values(PERMISSIONS.accounts).map((p) => [p, false])),

    // Store - Can operate POS and view sales, cannot delete sales or manage products
    'store.view': true,
    'store.create_sale': true,
    'store.view_sales': true,
    'store.delete_sale': false,
    'store.manage_products': false
  },

  receptionist: {
    // Dashboard
    'dashboard.view_financial': false,

    // Members - View and create only
    'members.view': true,
    'members.create': true,
    'members.edit': false,
    'members.delete': false,
    'members.view_details': true,

    // Memberships - View and check payments
    'memberships.view': true,
    'memberships.create': true,
    'memberships.edit': false,
    'memberships.delete': false,
    'memberships.view_details': true,
    'memberships.extend': true,
    'memberships.view_payments': true,
    'memberships.add_payment': false,
    'memberships.complete_payment': false,
    'memberships.modify_price': false,

    // Plans - View only
    'plans.view': true,
    'plans.create': false,
    'plans.edit': false,
    'plans.delete': false,

    // Check-ins - Full access
    ...Object.fromEntries(Object.values(PERMISSIONS.checkins).map((p) => [p, true])),

    // Reports - No access
    ...Object.fromEntries(Object.values(PERMISSIONS.reports).map((p) => [p, false])),

    // Settings - No access
    ...Object.fromEntries(Object.values(PERMISSIONS.settings).map((p) => [p, false])),

    // Accounts - No access
    ...Object.fromEntries(Object.values(PERMISSIONS.accounts).map((p) => [p, false])),

    // Store - Can operate POS only
    'store.view': true,
    'store.create_sale': true,
    'store.view_sales': false,
    'store.delete_sale': false,
    'store.manage_products': false
  },

  custom: getEmptyPermissions()
}

// Role labels for UI display
export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrator',
  manager: 'Manager',
  coach: 'Coach',
  receptionist: 'Receptionist',
  custom: 'Custom'
}

// Role descriptions
export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  admin: 'Full access to all features and settings',
  manager: 'Access to operations and reports, limited system settings',
  coach: 'Access to members, memberships, plans, and check-ins',
  receptionist: 'Access to check-ins and basic member information',
  custom: 'Custom permissions configured manually'
}

// Helper function to get permissions for a role
export function getPermissionsForRole(role: UserRole): UserPermissions {
  return { ...ROLE_PERMISSIONS[role] }
}

// Helper function to check if permissions match a specific role
export function permissionsMatchRole(permissions: UserPermissions, role: UserRole): boolean {
  const rolePermissions = ROLE_PERMISSIONS[role]

  // Check if all permissions match
  return ALL_PERMISSIONS.every(
    (permission) => permissions[permission] === rolePermissions[permission]
  )
}

// Helper function to detect which role matches the current permissions
export function detectRoleFromPermissions(permissions: UserPermissions): UserRole {
  // Check each role in order (excluding custom)
  const rolesToCheck: UserRole[] = ['admin', 'manager', 'coach', 'receptionist']

  for (const role of rolesToCheck) {
    if (permissionsMatchRole(permissions, role)) {
      return role
    }
  }

  // If no role matches, return custom
  return 'custom'
}

// Helper function to resolve permission dependencies
// When a permission is enabled, automatically enable all its dependencies
export function resolvePermissionDependencies(
  permissions: UserPermissions,
  changedPermission: string,
  isEnabled: boolean
): UserPermissions {
  const result = { ...permissions }

  if (isEnabled) {
    // If enabling a permission, enable all its dependencies
    const dependencies = PERMISSION_DEPENDENCIES[changedPermission] || []
    dependencies.forEach((dep) => {
      result[dep] = true
    })
  } else {
    // If disabling a permission, disable all permissions that depend on it
    Object.entries(PERMISSION_DEPENDENCIES).forEach(([permission, deps]) => {
      if (deps.includes(changedPermission)) {
        result[permission] = false
      }
    })
  }

  return result
}

// Helper function to check if a permission is required by any enabled permission
export function isPermissionRequired(permission: string, permissions: UserPermissions): boolean {
  return Object.entries(PERMISSION_DEPENDENCIES).some(
    ([perm, deps]) => permissions[perm] === true && deps.includes(permission)
  )
}
