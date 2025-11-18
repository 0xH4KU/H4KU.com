import { describe, it, expect } from 'vitest';
import { coverageBump } from '../coverageBump';

describe('coverageBump helper', () => {
  it('returns yes when flag is true', () => {
    expect(coverageBump(true)).toBe('yes');
  });

  it('returns no when flag is false', () => {
    expect(coverageBump(false)).toBe('no');
  });
});
