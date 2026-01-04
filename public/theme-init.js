(function initTheme() {
  let theme = 'light';

  try {
    const storedTheme = localStorage.getItem('H4KU.com.theme');
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
  document.documentElement.style.colorScheme = theme;

  const setInitialVh = () => {
    const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
    document.documentElement.style.setProperty(
      '--vh',
      `${viewportHeight * 0.01}px`
    );
  };

  setInitialVh();
})();
