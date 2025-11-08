/**
 * Simple frontmatter parser for markdown files
 * Parses YAML frontmatter between --- delimiters
 */
type Frontmatter = Record<string, string>;

export function parseFrontmatter(content: string): {
  data: Frontmatter;
  content: string;
} {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);

  if (!match) {
    return { data: {}, content };
  }

  const [, frontmatter, body] = match;
  const data: Frontmatter = {};

  // Parse simple YAML frontmatter (key: value pairs)
  frontmatter.split('\n').forEach((line) => {
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      const key = line.slice(0, colonIndex).trim();
      const value = line.slice(colonIndex + 1).trim();
      data[key] = value;
    }
  });

  return { data, content: body };
}
