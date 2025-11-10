import { describe, it, expect } from 'vitest';

describe('Test Environment', () => {
  it('should run a basic test', () => {
    expect(1 + 1).toBe(2);
  });

  it('should have access to globals', () => {
    expect(window).toBeDefined();
    expect(document).toBeDefined();
  });

  it('should have localStorage mock', () => {
    localStorage.setItem('test', 'value');
    expect(localStorage.getItem('test')).toBe('value');
    localStorage.clear();
  });
});
