import {
  createContext,
  useContext,
  useState,
  useEffect,
  useLayoutEffect,
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

const resolveThemeColor = (mode: Theme) => {
  const fallback =
    mode === 'light' ? THEME_COLORS.LIGHT.SURFACE : THEME_COLORS.DARK.SURFACE;

  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return fallback;
  }

  // Use current computed value; if unavailable, fall back to palette constant
  const rootStyles = window.getComputedStyle(document.documentElement);
  const chromeColor = rootStyles.getPropertyValue('--color-chrome').trim();
  return chromeColor || fallback;
};

const getInitialSystemTheme = (): Theme => {
  if (typeof document !== 'undefined') {
    const preHydrated = document.documentElement.getAttribute('data-theme');
    if (preHydrated === 'light' || preHydrated === 'dark') {
      return preHydrated;
    }
  }

  try {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
    }
  } catch {
    /* ignore matchMedia issues */
  }

  return 'light';
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [storedTheme, setStoredTheme] = useLocalStorage<Theme | null>(
    STORAGE_KEYS.THEME,
    null
  );
  const [systemTheme, setSystemTheme] = useState<Theme>(getInitialSystemTheme);

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
  useLayoutEffect(() => {
    /* c8 ignore next */
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }

    // Update data-theme attribute (sync with pre-hydration script)
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.style.colorScheme = theme;
    document.body?.setAttribute('data-theme', theme);

    const activeColor = resolveThemeColor(theme);
    const inactiveColor =
      theme === 'light'
        ? THEME_COLORS.DARK.SURFACE
        : THEME_COLORS.LIGHT.SURFACE;

    // Ensure both theme-color metas exist so the browser has hints for either scheme
    const activeMeta = ensureThemeMeta(theme);
    activeMeta.setAttribute('content', activeColor);

    const fallbackMeta = ensureThemeMeta(theme === 'light' ? 'dark' : 'light');
    fallbackMeta.setAttribute('content', inactiveColor);
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
