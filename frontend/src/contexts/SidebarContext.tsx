import { createContext, useState } from 'react';

export interface SidebarContextType {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
}

// eslint-disable-next-line react-refresh/only-export-components
export const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export default function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <SidebarContext.Provider value={{ collapsed, setCollapsed }}>
      {children}
    </SidebarContext.Provider>
  );
}
