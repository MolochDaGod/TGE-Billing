import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { User } from '@shared/schema';

type ViewAsRole = User['role'] | null;

interface RoleSwitchContextType {
  viewAsRole: ViewAsRole;
  setViewAsRole: (role: ViewAsRole) => void;
  effectiveRole: User['role'];
  canSwitchRoles: boolean;
}

const RoleSwitchContext = createContext<RoleSwitchContextType | undefined>(undefined);

interface RoleSwitchProviderProps {
  children: ReactNode;
  user: User | null;
}

export function RoleSwitchProvider({ children, user }: RoleSwitchProviderProps) {
  const [viewAsRole, setViewAsRole] = useState<ViewAsRole>(null);
  
  // Determine if the user can switch roles
  const canSwitchRoles = user ? ['pirate_king', 'admin', 'partner', 'vendor'].includes(user.role) : false;
  
  // Effective role is the viewAsRole if set, otherwise the user's actual role
  const effectiveRole = (viewAsRole || user?.role || 'client') as User['role'];
  
  // Load saved preference from localStorage
  useEffect(() => {
    if (canSwitchRoles) {
      const saved = localStorage.getItem('viewAsRole');
      if (saved && saved !== 'null') {
        setViewAsRole(saved as ViewAsRole);
      }
    }
  }, [canSwitchRoles]);
  
  // Save preference to localStorage
  const handleSetViewAsRole = (role: ViewAsRole) => {
    setViewAsRole(role);
    if (role) {
      localStorage.setItem('viewAsRole', role);
    } else {
      localStorage.removeItem('viewAsRole');
    }
  };
  
  return (
    <RoleSwitchContext.Provider
      value={{
        viewAsRole,
        setViewAsRole: handleSetViewAsRole,
        effectiveRole,
        canSwitchRoles,
      }}
    >
      {children}
    </RoleSwitchContext.Provider>
  );
}

export function useRoleSwitch() {
  const context = useContext(RoleSwitchContext);
  if (context === undefined) {
    throw new Error('useRoleSwitch must be used within a RoleSwitchProvider');
  }
  return context;
}
