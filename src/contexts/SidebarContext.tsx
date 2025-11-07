import React, {
  createContext,
  useState,
  useContext,
  ReactNode,
  useEffect,
} from 'react';

interface SidebarContextType {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  openSidebar: () => void;
  closeSidebar: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

const DESKTOP_BREAKPOINT = 768;

const getInitialSidebarState = () => {
  if (typeof window === 'undefined') {
    return true;
  }
  return window.innerWidth >= DESKTOP_BREAKPOINT;
};

export const SidebarProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [isSidebarOpen, setSidebarOpen] = useState(getInitialSidebarState);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const mediaQuery = window.matchMedia(`(min-width: ${DESKTOP_BREAKPOINT}px)`);
    setSidebarOpen(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      setSidebarOpen(event.matches);
    };

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }

    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(prevState => !prevState);
  };

  const openSidebar = () => setSidebarOpen(true);
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <SidebarContext.Provider
      value={{ isSidebarOpen, toggleSidebar, openSidebar, closeSidebar }}
    >
      {children}
    </SidebarContext.Provider>
  );
};

export const useSidebarContext = () => {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error('useSidebarContext must be used within a SidebarProvider');
  }
  return context;
};
