import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import { Permission } from '../utils/permissions';
import { Shield } from 'lucide-react';

interface RoleGuardProps {
  children: React.ReactNode;
  section: keyof Permission;
  fallback?: React.ReactNode;
  showFallback?: boolean;
}

const RoleGuard: React.FC<RoleGuardProps> = ({
  children,
  section,
  fallback,
  showFallback = true
}) => {
  const { role, loading } = useAuth();
  const { hasPermission } = usePermissions(role);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-400"></div>
      </div>
    );
  }

  if (!hasPermission(section)) {
    if (!showFallback) return null;
    
    return fallback || (
      <div className="glass-card p-6 text-center">
        <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-300 mb-2">
          Access Restricted
        </h3>
        <p className="text-gray-400 text-sm">
          You don't have permission to access this section.
        </p>
      </div>
    );
  }

  return <>{children}</>;
};

export default RoleGuard;