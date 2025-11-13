import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { NavigationProvider } from '@/contexts/NavigationContext';
import { SidebarProvider } from '@/contexts/SidebarContext';

/**
 * Custom render function that wraps components with common providers
 */
export function renderWithProviders(
  ui: ReactElement,
  renderOptions?: RenderOptions
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <ThemeProvider>
        <NavigationProvider>
          <SidebarProvider>{children}</SidebarProvider>
        </NavigationProvider>
      </ThemeProvider>
    );
  }

  return { ...render(ui, { wrapper: Wrapper, ...renderOptions }) };
}

/**
 * Minimal wrapper for testing hooks that need only ThemeProvider
 */
export function renderWithTheme(
  ui: ReactElement,
  renderOptions?: RenderOptions
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return <ThemeProvider>{children}</ThemeProvider>;
  }

  return { ...render(ui, { wrapper: Wrapper, ...renderOptions }) };
}

/**
 * Create a mock file for testing
 */
export function createMockFile(name: string, size: number, type: string): File {
  const blob = new Blob(['a'.repeat(size)], { type });
  return new File([blob], name, { type });
}

/**
 * Wait for a condition to be true
 */
export async function waitFor(
  condition: () => boolean,
  timeout = 3000
): Promise<void> {
  const startTime = Date.now();

  while (!condition()) {
    if (Date.now() - startTime > timeout) {
      throw new Error('Timeout waiting for condition');
    }
    await new Promise(resolve => setTimeout(resolve, 50));
  }
}

/**
 * Mock window dimensions for responsive testing
 */
export function mockWindowDimensions(width: number, height: number) {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: height,
  });
  window.dispatchEvent(new Event('resize'));
}

// Re-export everything from @testing-library/react
export * from '@testing-library/react';
