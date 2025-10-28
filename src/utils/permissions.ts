export type UserRole = 'User' | 'Admin' | 'Finance';

export interface Permission {
  dashboard: boolean;
  leads: boolean;
  sales: boolean;
  documents: boolean;
  operations: boolean;
  strategy: boolean;
  tools: boolean;
  finances: boolean;
  team: boolean;
  offer: boolean;
  payment: boolean;
}

// Hardcoded role permissions as specified
export const ROLE_PERMISSIONS: Record<UserRole, Permission> = {
  User: {
    dashboard: true,
    leads: true,
    sales: true,
    documents: true,
    operations: true,
    strategy: true,
    tools: true,
    finances: false,
    team: false,
    offer: false,
    payment: false,
  },
  Finance: {
    dashboard: true,
    leads: true,
    sales: true,
    documents: true,
    operations: true,
    strategy: true,
    tools: true,
    finances: true,
    team: true,
    offer: false,
    payment: false,
  },
  Admin: {
    dashboard: true,
    leads: true,
    sales: true,
    documents: true,
    operations: true,
    strategy: true,
    tools: true,
    finances: true,
    team: true,
    offer: true,
    payment: true,
  },
};

export const hasPermission = (role: UserRole | undefined, section: keyof Permission): boolean => {
  if (!role) return false;
  return ROLE_PERMISSIONS[role][section] || false;
};

export const getUserPermissions = (role: UserRole | undefined): Permission => {
  if (!role) {
    return Object.keys(ROLE_PERMISSIONS.User).reduce((acc, key) => {
      acc[key as keyof Permission] = false;
      return acc;
    }, {} as Permission);
  }
  return ROLE_PERMISSIONS[role];
};