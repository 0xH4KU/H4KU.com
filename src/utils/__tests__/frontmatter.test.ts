import { describe, it, expect } from 'vitest';
import { parseFrontmatter } from '../frontmatter';

describe('parseFrontmatter', () => {
  it('should parse valid frontmatter', () => {
    const content = `---
title: Test Post
author: John Doe
date: 2024-01-01
---
This is the content.`;

    const result = parseFrontmatter(content);

    expect(result.data).toEqual({
      title: 'Test Post',
      author: 'John Doe',
      date: '2024-01-01',
    });
    expect(result.content).toBe('This is the content.');
  });

  it('should handle content without frontmatter', () => {
    const content = 'Just plain content without frontmatter.';

    const result = parseFrontmatter(content);

    expect(result.data).toEqual({});
    expect(result.content).toBe(content);
  });

  it('should handle empty frontmatter', () => {
    const content = `---
---
Content after empty frontmatter.`;

    const result = parseFrontmatter(content);

    // Empty frontmatter still matches the pattern
    expect(result.data).toEqual({});
    // The regex doesn't match just ---\n--- so returns original content
    expect(result.content).toBe(content);
  });

  it('should handle frontmatter with various spacing', () => {
    const content = `---
title:   Spaced Value
author:John
tags:  test, example
---
Content here.`;

    const result = parseFrontmatter(content);

    expect(result.data).toEqual({
      title: 'Spaced Value',
      author: 'John',
      tags: 'test, example',
    });
    expect(result.content).toBe('Content here.');
  });

  it('should handle multiline content', () => {
    const content = `---
title: Multi
---
Line one
Line two
Line three`;

    const result = parseFrontmatter(content);

    expect(result.data).toEqual({
      title: 'Multi',
    });
    expect(result.content).toBe('Line one\nLine two\nLine three');
  });

  it('should ignore lines without colons in frontmatter', () => {
    const content = `---
title: Valid
invalid line without colon
author: Another Valid
---
Content.`;

    const result = parseFrontmatter(content);

    expect(result.data).toEqual({
      title: 'Valid',
      author: 'Another Valid',
    });
    expect(result.content).toBe('Content.');
  });

  it('should handle frontmatter with empty values', () => {
    const content = `---
title:
author: John
description:
---
Content.`;

    const result = parseFrontmatter(content);

    expect(result.data).toEqual({
      title: '',
      author: 'John',
      description: '',
    });
    expect(result.content).toBe('Content.');
  });

  it('should handle frontmatter with special characters in values', () => {
    const content = `---
title: Title with: colons: in: it
url: https://example.com
---
Content.`;

    const result = parseFrontmatter(content);

    expect(result.data).toEqual({
      title: 'Title with: colons: in: it',
      url: 'https://example.com',
    });
    expect(result.content).toBe('Content.');
  });

  it('should handle empty content after frontmatter', () => {
    const content = `---
title: Test
---
`;

    const result = parseFrontmatter(content);

    expect(result.data).toEqual({
      title: 'Test',
    });
    expect(result.content).toBe('');
  });

  it('should handle content with dashes that are not frontmatter delimiters', () => {
    const content = `This is content
--- not a frontmatter
More content`;

    const result = parseFrontmatter(content);

    expect(result.data).toEqual({});
    expect(result.content).toBe(content);
  });

  it('should handle keys with underscores and hyphens', () => {
    const content = `---
title_key: Value 1
author-name: Value 2
some_mixed-key: Value 3
---
Content.`;

    const result = parseFrontmatter(content);

    expect(result.data).toEqual({
      title_key: 'Value 1',
      'author-name': 'Value 2',
      'some_mixed-key': 'Value 3',
    });
    expect(result.content).toBe('Content.');
  });

  it('should handle numbers and booleans as string values', () => {
    const content = `---
count: 42
enabled: true
ratio: 3.14
---
Content.`;

    const result = parseFrontmatter(content);

    expect(result.data).toEqual({
      count: '42',
      enabled: 'true',
      ratio: '3.14',
    });
    expect(result.content).toBe('Content.');
  });
});
