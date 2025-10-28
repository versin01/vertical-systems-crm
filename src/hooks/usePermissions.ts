import { useMemo } from 'react';
import { UserRole, hasPermission, getUserPermissions, Permission } from '../utils/permissions';

export const usePermissions = (role: UserRole | undefined) => {
  const permissions = useMemo(() => getUserPermissions(role), [role]);
  
  const checkPermission = useMemo(() => 
    (section: keyof Permission) => hasPermission(role, section),
    [role]
  );

  return {
    permissions,
    hasPermission: checkPermission,
    canAccess: checkPermission,
  };
};