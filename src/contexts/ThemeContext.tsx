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

  // Apply theme to document and meta tag
  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }

    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.style.colorScheme = theme;
    document.body?.setAttribute('data-theme', theme);

    const fallbackForTheme = (mode: Theme) =>
      mode === 'light' ? THEME_COLORS.LIGHT.SURFACE : THEME_COLORS.DARK.SURFACE;

    const getChromeColorForTheme = (mode: Theme) => {
      const fallback = fallbackForTheme(mode);

      if (mode === theme) {
        const rootStyles = window.getComputedStyle(document.documentElement);
        return rootStyles.getPropertyValue('--color-chrome').trim() || fallback;
      }

      const probe = document.createElement('div');
      probe.setAttribute('data-theme', mode);
      probe.style.position = 'absolute';
      probe.style.pointerEvents = 'none';
      probe.style.opacity = '0';
      probe.style.height = '0';
      probe.style.width = '0';
      const parent = document.body ?? document.documentElement;
      parent.appendChild(probe);

      try {
        const computed = window
          .getComputedStyle(probe)
          .getPropertyValue('--color-chrome')
          .trim();
        return computed || fallback;
      } finally {
        probe.remove();
      }
    };

    const ensureThemeMeta = (mode: Theme) => {
      const selector =
        mode === 'light'
          ? 'meta[name="theme-color"][media*="light"]'
          : 'meta[name="theme-color"][media*="dark"]';
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
      return meta;
    };

    const lightColor = getChromeColorForTheme('light');
    const darkColor = getChromeColorForTheme('dark');

    const metaLight = ensureThemeMeta('light');
    const metaDark = ensureThemeMeta('dark');

    metaLight.setAttribute('content', lightColor);
    const refreshedLight = metaLight.cloneNode(true) as HTMLMetaElement;
    metaLight.parentNode?.replaceChild(refreshedLight, metaLight);

    metaDark.setAttribute('content', darkColor);
    const refreshedDark = metaDark.cloneNode(true) as HTMLMetaElement;
    metaDark.parentNode?.replaceChild(refreshedDark, metaDark);
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
