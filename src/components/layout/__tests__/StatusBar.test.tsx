import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { ViewType } from '@/types';

type IntegrityStub = {
  isValid: boolean;
  expected: string | null;
  actual: string;
};

type RenderOptions = {
  integrity?: IntegrityStub;
  currentView?: ViewType | null;
  socials?: Array<{ name: string; code: string; url: string }>;
  safeUrlMock?: (
    url: string
  ) => ReturnType<(typeof import('@/utils/urlHelpers'))['getSafeUrl']>;
};

const DEFAULT_INTEGRITY: IntegrityStub = {
  isValid: true,
  expected: 'aaaa1111',
  actual: 'aaaa1111',
};

const renderStatusBar = async (options: RenderOptions = {}) => {
  const { integrity = DEFAULT_INTEGRITY, currentView = null } = options;

  vi.doMock('@/contexts/NavigationContext', () => ({
    useNavigation: () => ({
      currentView,
    }),
  }));
  vi.doMock('@/contexts/SortContext', () => ({
    useSortOrder: () => ({
      sortOrder: 'desc',
      toggleSortOrder: vi.fn(),
      typeOrder: 'folders-first',
      toggleTypeOrder: vi.fn(),
    }),
  }));
  vi.doMock('@/data/mockData', () => ({
    mockData: {
      socials: options.socials ?? [
        { name: 'Email', code: 'EM', url: 'mailto:test@example.com' },
      ],
      folders: [],
      pages: [],
      homeItems: [],
    },
    dataIntegrity: integrity,
  }));
  vi.doMock('@/utils/urlHelpers', () => ({
    getSafeUrl:
      options.safeUrlMock ??
      ((url: string) => ({
        href: url,
        isExternal: url.startsWith('http'),
        isMailto: url.startsWith('mailto'),
      })),
  }));

  const module = await import('../StatusBar');
  const StatusBar = module.default;
  return render(<StatusBar />);
};

describe('StatusBar integrity indicator', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('shows verified status when checksums match', async () => {
    await renderStatusBar({
      integrity: { isValid: true, expected: 'aaaa1111', actual: 'aaaa1111' },
    });
    expect(screen.getByText(/\[verified]/i)).toBeInTheDocument();
    expect(
      screen.queryByText(/checksum mismatch detected/i)
    ).not.toBeInTheDocument();
  });

  it('warns visitors when tampering is detected', async () => {
    await renderStatusBar({
      integrity: { isValid: false, expected: 'aaaa1111', actual: 'bbbb2222' },
    });
    expect(screen.getByText(/\[tamper detected]/i)).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent(
      /checksum mismatch detected/i
    );
  });

  it('calculates folder item counts', async () => {
    const folderView = {
      type: 'folder',
      data: { items: [{ id: 'a' }, { id: 'b' }], children: [{ id: 'child' }] },
    } as unknown as ViewType;
    await renderStatusBar({ currentView: folderView });
    expect(screen.getByText('3 items')).toBeInTheDocument();
  });

  it('falls back to zero items for text views', async () => {
    const textView = {
      type: 'txt',
      data: { id: 'about', name: 'About', content: 'copy' },
    } as unknown as ViewType;
    await renderStatusBar({ currentView: textView });
    expect(screen.getByText('0 items')).toBeInTheDocument();
  });

  it('renders disabled socials when URL parsing fails', async () => {
    await renderStatusBar({
      socials: [{ name: 'Email', code: 'EM', url: 'mailto:test@example.com' }],
      safeUrlMock: () => null,
    });
    const disabled = screen.getByText('[EM]');
    expect(disabled).toHaveAttribute('aria-disabled', 'true');
  });
});
