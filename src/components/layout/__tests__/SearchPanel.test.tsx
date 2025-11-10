import { describe, it, expect } from 'vitest';
import userEvent from '@testing-library/user-event';
import SearchPanel from '../SearchPanel';
import { SearchProvider, useSearch } from '@/contexts/SearchContext';
import { renderWithProviders } from '@/tests/utils';
import { screen, waitFor } from '@testing-library/react';

const SearchTrigger = () => {
  const { openSearch } = useSearch();
  return (
    <button type="button" onClick={openSearch}>
      Open Search
    </button>
  );
};

const SearchPanelHarness = () => (
  <SearchProvider>
    <SearchTrigger />
    <SearchPanel />
  </SearchProvider>
);

describe('SearchPanel accessibility', () => {
  it('returns focus to the trigger after closing', async () => {
    renderWithProviders(<SearchPanelHarness />);
    const trigger = screen.getByRole('button', { name: /open search/i });
    trigger.focus();

    await userEvent.click(trigger);
    const input = await screen.findByPlaceholderText(/type to search/i);
    expect(input).toHaveFocus();

    await userEvent.click(
      screen.getByRole('button', { name: /close search panel/i })
    );

    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it('traps focus within the dialog while open', async () => {
    renderWithProviders(<SearchPanelHarness />);
    const trigger = screen.getByRole('button', { name: /open search/i });
    await userEvent.click(trigger);

    const input = await screen.findByPlaceholderText(/type to search/i);
    expect(input).toHaveFocus();

    await userEvent.keyboard('{Shift>}{Tab}{/Shift}');
    const closeButton = screen.getByRole('button', {
      name: /close search panel/i,
    });
    expect(closeButton).toHaveFocus();

    await userEvent.keyboard('{Tab}');
    expect(input).toHaveFocus();
  });
});
