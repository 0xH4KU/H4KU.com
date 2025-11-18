import { PropsWithChildren, FC, ReactNode } from 'react';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { SortProvider } from '@/contexts/SortContext';
import { NavigationProvider } from '@/contexts/NavigationContext';
import { LightboxProvider } from '@/contexts/LightboxContext';
import { SearchProvider } from '@/contexts/SearchContext';
import { SidebarProvider } from '@/contexts/SidebarContext';

type ProviderComponent = FC<{ children: ReactNode }>;

const providers: ProviderComponent[] = [
  ThemeProvider,
  SortProvider,
  NavigationProvider,
  LightboxProvider,
  SearchProvider,
  SidebarProvider,
];

export const AppProviders = ({ children }: PropsWithChildren) =>
  providers.reduceRight<ReactNode>(
    (acc, Provider) => <Provider>{acc}</Provider>,
    children ?? null
  );

export type { ProviderComponent };
