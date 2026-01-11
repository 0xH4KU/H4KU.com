import { PropsWithChildren } from 'react';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { SortProvider } from '@/contexts/SortContext';
import { NavigationProvider } from '@/contexts/NavigationContext';
import { LightboxProvider } from '@/contexts/LightboxContext';
import { SearchProvider } from '@/contexts/SearchContext';
import { SidebarProvider } from '@/contexts/SidebarContext';

export const AppProviders = ({ children }: PropsWithChildren) => (
  <ThemeProvider>
    <SortProvider>
      <NavigationProvider>
        <LightboxProvider>
          <SearchProvider>
            <SidebarProvider>{children}</SidebarProvider>
          </SearchProvider>
        </LightboxProvider>
      </NavigationProvider>
    </SortProvider>
  </ThemeProvider>
);
