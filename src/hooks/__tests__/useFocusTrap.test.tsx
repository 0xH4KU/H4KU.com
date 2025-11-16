import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent, waitFor } from '@testing-library/react';
import React, { useRef } from 'react';
import { useFocusTrap } from '../useFocusTrap';

type HarnessProps = {
  active: boolean;
  withInitial?: boolean;
  hasFocusableChildren?: boolean;
  onEscape?: () => void;
  restoreFocus?: boolean;
  containerTabIndex?: number;
  renderContainer?: boolean;
};

const FocusTrapHarness: React.FC<HarnessProps> = ({
  active,
  withInitial = false,
  hasFocusableChildren = true,
  onEscape,
  restoreFocus,
  containerTabIndex = -1,
  renderContainer = true,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const initialRef = useRef<HTMLButtonElement | null>(null);

  useFocusTrap({
    containerRef,
    active,
    initialFocusRef: withInitial ? initialRef : undefined,
    onEscape,
    restoreFocus,
  });

  return (
    <div>
      <button data-testid="outside">Outside</button>
      {renderContainer ? (
        <div ref={containerRef} data-testid="trap" tabIndex={containerTabIndex}>
          {hasFocusableChildren ? (
            <>
              <button data-testid="first">First</button>
              <button
                data-testid="initial"
                ref={withInitial ? initialRef : undefined}
              >
                Second
              </button>
              <button data-testid="last">Last</button>
            </>
          ) : (
            <span>No focusable children</span>
          )}
        </div>
      ) : null}
    </div>
  );
};

describe('useFocusTrap', () => {
  it('focuses the initial target and restores prior focus when disabled', async () => {
    const { rerender, getByTestId } = render(
      <FocusTrapHarness active={false} withInitial />
    );

    const outside = getByTestId('outside');
    outside.focus();
    expect(outside).toHaveFocus();

    rerender(<FocusTrapHarness active withInitial />);

    await waitFor(() => expect(getByTestId('initial')).toHaveFocus());

    rerender(<FocusTrapHarness active={false} withInitial />);

    await waitFor(() => expect(outside).toHaveFocus());
  });

  it('wraps focus when tabbing past the ends of the focus trap', async () => {
    const { getByTestId } = render(<FocusTrapHarness active />);
    const first = getByTestId('first');
    const last = getByTestId('last');

    await waitFor(() => expect(first).toHaveFocus());

    last.focus();
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(first).toHaveFocus();

    first.focus();
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(last).toHaveFocus();
  });

  it('keeps focus on the container when no inner elements exist', async () => {
    const { getByTestId } = render(
      <FocusTrapHarness active hasFocusableChildren={false} />
    );
    const container = getByTestId('trap');

    await waitFor(() => expect(container).toHaveFocus());

    fireEvent.keyDown(document, { key: 'Tab' });
    expect(container).toHaveFocus();
  });

  it('invokes the escape handler when Escape is pressed', () => {
    const onEscape = vi.fn();
    render(<FocusTrapHarness active withInitial onEscape={onEscape} />);

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onEscape).toHaveBeenCalledTimes(1);
  });

  it('does not restore focus when restoreFocus is disabled', async () => {
    const { rerender, getByTestId } = render(
      <FocusTrapHarness active={false} restoreFocus={false} />
    );
    const outside = getByTestId('outside');
    outside.focus();

    rerender(<FocusTrapHarness active restoreFocus={false} />);
    await waitFor(() => expect(getByTestId('first')).toHaveFocus());

    rerender(<FocusTrapHarness active={false} restoreFocus={false} />);
    expect(outside).not.toHaveFocus();
  });

  it('adds a tabindex when the container lacks focusable children', async () => {
    const { getByTestId } = render(
      <FocusTrapHarness
        active
        hasFocusableChildren={false}
        containerTabIndex={0}
      />
    );
    const trap = getByTestId('trap');

    await waitFor(() => expect(trap).toHaveFocus());
    expect(trap.getAttribute('tabindex')).toBe('-1');
  });

  it('redirects shift+Tab to the last element when focus starts outside', async () => {
    const { getByTestId } = render(<FocusTrapHarness active />);
    const outside = getByTestId('outside');

    await waitFor(() => expect(getByTestId('first')).toHaveFocus());
    outside.focus();
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(getByTestId('last')).toHaveFocus();
  });

  it('redirects Tab to the first element when focus is outside the container', async () => {
    const { getByTestId } = render(<FocusTrapHarness active />);
    const outside = getByTestId('outside');

    await waitFor(() => expect(getByTestId('first')).toHaveFocus());
    outside.focus();
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(getByTestId('first')).toHaveFocus();
  });

  it('ignores key presses when the container is not rendered', () => {
    const { rerender, getByTestId } = render(<FocusTrapHarness active />);
    rerender(<FocusTrapHarness active renderContainer={false} />);
    const outside = getByTestId('outside');
    outside.focus();
    expect(() => fireEvent.keyDown(document, { key: 'Tab' })).not.toThrow();
    expect(outside).toHaveFocus();
  });

  it('handles shift+Tab when focus already sits on the first element', async () => {
    const { getByTestId } = render(<FocusTrapHarness active />);
    const first = getByTestId('first');
    await waitFor(() => expect(first).toHaveFocus());
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(getByTestId('last')).toHaveFocus();
  });

  it('handles forward Tab when focus is on the last element', async () => {
    const { getByTestId } = render(<FocusTrapHarness active />);
    const last = getByTestId('last');
    await waitFor(() => expect(getByTestId('first')).toHaveFocus());
    last.focus();
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(getByTestId('first')).toHaveFocus();
  });

  it('skips focus trapping when no container is present initially', () => {
    expect(() =>
      render(<FocusTrapHarness active renderContainer={false} />)
    ).not.toThrow();
  });
});
