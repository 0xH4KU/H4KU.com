import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
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
    /* c8 ignore next */
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

  const themeMetaRefs = useRef<{
    light: HTMLMetaElement | null;
    dark: HTMLMetaElement | null;
  }>({ light: null, dark: null });

  const ensureThemeMeta = (mode: Theme) => {
    const selector =
      mode === 'light'
        ? 'meta[name="theme-color"][media*="light"]'
        : 'meta[name="theme-color"][media*="dark"]';

    if (themeMetaRefs.current[mode]) {
      return themeMetaRefs.current[mode];
    }

    let meta = document.querySelector<HTMLMetaElement>(selector);

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

    themeMetaRefs.current[mode] = meta;
    return meta;
  };

  // Apply theme to document and update meta tags
  useEffect(() => {
    /* c8 ignore next */
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }

    // Update data-theme attribute (sync with pre-hydration script)
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.style.colorScheme = theme;
    document.body?.setAttribute('data-theme', theme);

    const fallback =
      theme === 'light'
        ? THEME_COLORS.LIGHT.SURFACE
        : THEME_COLORS.DARK.SURFACE;

    const rootStyles = window.getComputedStyle(document.documentElement);
    const chromeColor = rootStyles.getPropertyValue('--color-chrome').trim();
    const color = chromeColor || fallback;

    const meta = ensureThemeMeta(theme);
    meta.setAttribute('content', color);
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
