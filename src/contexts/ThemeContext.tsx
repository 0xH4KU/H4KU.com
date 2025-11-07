import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';

type Theme = 'light' | 'dark';

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
  systemTheme: Theme;
  hasStoredTheme: boolean;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const THEME_STORAGE_KEY = 'lum.bio.theme';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [storedTheme, setStoredTheme] = useLocalStorage<Theme | null>(
    THEME_STORAGE_KEY,
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

  // Apply theme to document and meta tag
  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }

    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.style.colorScheme = theme;
    document.body?.setAttribute('data-theme', theme);

    const ensureMeta = () => {
      let meta = document.querySelector<HTMLMetaElement>(
        'meta[name="theme-color"]'
      );
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('name', 'theme-color');
        document.head.appendChild(meta);
      }
      return meta;
    };

    const fallbackThemeColor = theme === 'light' ? '#f5f5f5' : '#1a1a1a';
    const rootStyles = window.getComputedStyle(document.documentElement);
    const chromeColor =
      rootStyles.getPropertyValue('--color-chrome').trim() || fallbackThemeColor;

    const metaThemeColor = ensureMeta();
    metaThemeColor.setAttribute('content', chromeColor);

    // Safari only re-evaluates the color when the node is replaced.
    const refreshedMeta = metaThemeColor.cloneNode(true) as HTMLMetaElement;
    metaThemeColor.parentNode?.replaceChild(refreshedMeta, metaThemeColor);
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
