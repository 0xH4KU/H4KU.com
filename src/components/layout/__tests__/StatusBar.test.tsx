import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { ViewType } from '@/types';

type IntegrityStub = {
  isValid: boolean;
  expected: string | null;
  actual: string;
  algorithm?: 'fnv1a' | 'sha256';
  details?: {
    fnv1a: IntegrityStubResult;
    sha256: IntegrityStubResult;
    isFullyValid: boolean;
  };
};

type IntegrityStubResult = {
  expected: string | null;
  actual: string;
  isValid: boolean;
  algorithm: 'fnv1a' | 'sha256';
};

type RenderOptions = {
  integrity?: IntegrityStub;
  currentView?: ViewType | null;
  socials?: Array<{ name: string; code: string; url: string }>;
  safeUrlMock?: (
    url: string
  ) => ReturnType<(typeof import('@/utils/urlHelpers'))['getSafeUrl']>;
  sortOverrides?: Partial<{
    sortOrder: 'asc' | 'desc';
    toggleSortOrder: () => void;
    typeOrder: 'folders-first' | 'images-first';
    toggleTypeOrder: () => void;
  }>;
};

const DEFAULT_INTEGRITY: IntegrityStub = {
  isValid: true,
  expected: 'aaaa1111',
  actual: 'aaaa1111',
};

const renderStatusBar = async (options: RenderOptions = {}) => {
  const { integrity = DEFAULT_INTEGRITY, currentView = null } = options;
  const sortMocks = {
    sortOrder: options.sortOverrides?.sortOrder ?? 'desc',
    toggleSortOrder: options.sortOverrides?.toggleSortOrder ?? vi.fn(),
    typeOrder: options.sortOverrides?.typeOrder ?? 'folders-first',
    toggleTypeOrder: options.sortOverrides?.toggleTypeOrder ?? vi.fn(),
  };

  vi.doMock('@/contexts/NavigationContext', () => ({
    useNavigation: () => ({
      currentView,
    }),
  }));
  vi.doMock('@/contexts/SortContext', () => ({
    useSortOrder: () => sortMocks,
  }));
  const stubDetails = integrity.details ?? {
    fnv1a: {
      expected: integrity.expected,
      actual: integrity.actual,
      isValid: integrity.isValid,
      algorithm: 'fnv1a',
    },
    sha256: {
      expected: integrity.expected,
      actual: integrity.actual,
      isValid: integrity.isValid,
      algorithm: 'sha256',
    },
    isFullyValid: integrity.isValid,
  };

  vi.doMock('@/data/mockData', () => ({
    mockData: {
      socials: options.socials ?? [
        { name: 'Email', code: 'EM', url: 'mailto:test@example.com' },
      ],
      folders: [],
      pages: [],
      homeItems: [],
    },
    dataIntegrity: {
      ...integrity,
      algorithm: integrity.algorithm ?? 'sha256',
      details: stubDetails,
    },
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
  const view = render(<StatusBar />);
  return { ...view, sortMocks };
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
      /integrity mismatch detected/i
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

  it('adds rich metadata for mailto and external socials', async () => {
    await renderStatusBar({
      socials: [
        { name: 'Contact', code: 'CT', url: 'mailto:hello@example.com' },
        { name: 'Docs', code: 'DC', url: 'https://lum.bio/docs' },
      ],
    });

    const mailtoLink = screen.getByLabelText(
      /\[CT], Open Contact \(opens email client\)/i
    );
    expect(mailtoLink).toHaveAttribute('href', 'mailto:hello@example.com');
    expect(mailtoLink).not.toHaveAttribute('target');

    const externalLink = screen.getByLabelText(
      /\[DC], Open Docs \(opens in new tab\)/i
    );
    expect(externalLink).toHaveAttribute('href', 'https://lum.bio/docs');
    expect(externalLink).toHaveAttribute('target', '_blank');
    expect(externalLink).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('invokes sort toggles when controls are clicked', async () => {
    const sortOverrides = {
      sortOrder: 'asc' as const,
      toggleSortOrder: vi.fn(),
      typeOrder: 'images-first' as const,
      toggleTypeOrder: vi.fn(),
    };
    await renderStatusBar({ sortOverrides });

    const sortButton = screen.getByRole('button', {
      name: /toggle sort order/i,
    });
    const typeButton = screen.getByRole('button', {
      name: /toggle type order/i,
    });

    expect(sortButton).toHaveTextContent('Z-A|0-9');
    expect(typeButton).toHaveTextContent('Img>P>F');

    fireEvent.click(sortButton);
    fireEvent.click(typeButton);

    expect(sortOverrides.toggleSortOrder).toHaveBeenCalledTimes(1);
    expect(sortOverrides.toggleTypeOrder).toHaveBeenCalledTimes(1);
  });
});
