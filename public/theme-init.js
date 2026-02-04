(function initTheme() {
  let theme = 'light';

  try {
    const storedTheme = localStorage.getItem('H4KU.COM.theme');
    if (storedTheme === 'light' || storedTheme === 'dark') {
      theme = storedTheme;
    } else if (matchMedia('(prefers-color-scheme: dark)').matches) {
      theme = 'dark';
    }
  } catch (error) {
    // Fallback when localStorage or matchMedia is unavailable (private mode, etc.)
    try {
      if (matchMedia('(prefers-color-scheme: dark)').matches) {
        theme = 'dark';
      }
    } catch (_ignored) {
      theme = 'light';
    }
  }

  document.documentElement.setAttribute('data-theme', theme);

  const ensureThemeColorMeta = () => {
    let meta = document.querySelector('meta[name="theme-color"]:not([media])');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'theme-color');
      document.head.appendChild(meta);
    }
    return meta;
  };

  const themeColor = theme === 'dark' ? '#0f0f0f' : '#e8e8e8';
  ensureThemeColorMeta().setAttribute('content', themeColor);

})();
