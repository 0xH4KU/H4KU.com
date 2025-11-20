(function initTheme() {
  try {
    const storedTheme = localStorage.getItem('lum.bio.theme');
    const theme =
      storedTheme === 'light' || storedTheme === 'dark'
        ? storedTheme
        : matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light';
    document.documentElement.setAttribute('data-theme', theme);
  } catch (error) {
    /* localStorage or matchMedia may be unavailable (private mode, etc.) */
  }

  const setInitialVh = () => {
    const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
    document.documentElement.style.setProperty(
      '--vh',
      `${viewportHeight * 0.01}px`
    );
  };

  setInitialVh();
})();
