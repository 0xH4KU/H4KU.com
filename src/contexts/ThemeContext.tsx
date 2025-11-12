import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { STORAGE_KEYS, THEME_COLORS } from '@/config/constants';

type Theme = 'light' | 'dark';

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
  systemTheme: Theme;
  hasStoredTheme: boolean;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [storedTheme, setStoredTheme] = useLocalStorage<Theme | null>(
    STORAGE_KEYS.THEME,
    null
  );
  const [systemTheme, setSystemTheme] = useState<Theme>('light');

  // Detect system theme preference
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const updateSystemTheme = () => {
      setSystemTheme(mediaQuery.matches ? 'dark' : 'light');
    };

    updateSystemTheme();
    mediaQuery.addEventListener('change', updateSystemTheme);

    return () => mediaQuery.removeEventListener('change', updateSystemTheme);
  }, []);

  // Determine active theme
  const theme = storedTheme || systemTheme;
  const hasStoredTheme = storedTheme !== null;

  // Apply theme to document and update meta tags
  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }

    // Update data-theme attribute (sync with pre-hydration script)
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.style.colorScheme = theme;
    document.body?.setAttribute('data-theme', theme);

    // Update theme-color meta tags (create if missing)
    const updateThemeColorMeta = (mode: Theme) => {
      const selector =
        mode === 'light'
          ? 'meta[name="theme-color"][media*="light"]'
          : 'meta[name="theme-color"][media*="dark"]';

      let meta = document.querySelector<HTMLMetaElement>(selector);

      // Create meta tag if it doesn't exist
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('name', 'theme-color');
        meta.setAttribute(
          'media',
          mode === 'light'
            ? '(prefers-color-scheme: light)'
            : '(prefers-color-scheme: dark)'
        );
        document.head.appendChild(meta);
      }

      const fallback =
        mode === 'light'
          ? THEME_COLORS.LIGHT.SURFACE
          : THEME_COLORS.DARK.SURFACE;

      const rootStyles = window.getComputedStyle(document.documentElement);
      const chromeColor = rootStyles.getPropertyValue('--color-chrome').trim();
      const color = chromeColor || fallback;

      meta.setAttribute('content', color);
    };

    updateThemeColorMeta('light');
    updateThemeColorMeta('dark');
  }, [theme]);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setStoredTheme(newTheme);
  };

  return (
    <ThemeContext.Provider
      value={{ theme, toggleTheme, systemTheme, hasStoredTheme }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
