import React, { createContext, useContext, useState, ReactNode } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
}

interface AppContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  activeSidebarItem: string | null;
  setActiveSidebarItem: (item: string | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>({
    id: '1',
    email: 'admin@verticalsystems.com',
    name: 'Admin User'
  });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeSidebarItem, setActiveSidebarItem] = useState<string | null>(null);

  return (
    <AppContext.Provider value={{
      user,
      setUser,
      sidebarCollapsed,
      setSidebarCollapsed,
      activeSidebarItem,
      setActiveSidebarItem
    }}>
      {children}
    </AppContext.Provider>
  );
};