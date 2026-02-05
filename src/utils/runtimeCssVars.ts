const RUNTIME_VARS_SELECTOR = 'html[data-runtime-vars]';

let cachedRule: CSSStyleRule | null = null;
let cachedSheetCount: number | null = null;
let lastSearchAt = 0;
const SEARCH_THROTTLE_MS = 500;
const fallbackProps = new Set<string>();

const matchesRuntimeSelector = (selectorText: string): boolean => {
  return selectorText
    .split(',')
    .map(selector => selector.trim())
    .includes(RUNTIME_VARS_SELECTOR);
};

const findRuntimeRuleInRules = (rules: CSSRuleList): CSSStyleRule | null => {
  // Return the *last* matching rule in this list to respect cascade order.
  let found: CSSStyleRule | null = null;

  for (const rule of Array.from(rules)) {
    if (rule.type === CSSRule.STYLE_RULE) {
      const styleRule = rule as CSSStyleRule;
      if (matchesRuntimeSelector(styleRule.selectorText)) {
        found = styleRule;
      }
      continue;
    }

    const nestedRules = (rule as CSSRule & { cssRules?: CSSRuleList }).cssRules;
    if (nestedRules) {
      const nestedMatch = findRuntimeRuleInRules(nestedRules);
      if (nestedMatch) {
        found = nestedMatch;
      }
    }
  }

  return found;
};

const findRuntimeRule = (): CSSStyleRule | null => {
  if (typeof document === 'undefined') {
    return null;
  }

  const sheetCount = document.styleSheets.length;
  // CSS chunks can be injected after initial load (e.g., lazy routes / components).
  // If stylesheets changed, the previously cached rule may be overridden by a newer
  // identical selector, causing runtime vars to fall back to defaults (0px).
  if (cachedSheetCount !== null && cachedSheetCount !== sheetCount) {
    cachedRule = null;
    cachedSheetCount = null;
    lastSearchAt = 0; // bypass throttle on stylesheet changes
  }

  if (cachedRule) {
    return cachedRule;
  }

  const now = Date.now();
  if (now - lastSearchAt < SEARCH_THROTTLE_MS) {
    return null;
  }
  lastSearchAt = now;

  // Search from the end so we pick the last matching rule in cascade order.
  const sheets = Array.from(document.styleSheets);
  for (let i = sheets.length - 1; i >= 0; i -= 1) {
    const sheet = sheets[i]!;
    let rules: CSSRuleList;
    try {
      rules = sheet.cssRules;
    } catch {
      continue;
    }

    const match = findRuntimeRuleInRules(rules);
    if (match) {
      cachedRule = match;
      cachedSheetCount = sheetCount;
      return match;
    }
  }

  cachedSheetCount = sheetCount;
  return null;
};

const setFallbackStyleProp = (name: string, value: string): void => {
  if (typeof document === 'undefined') {
    return;
  }

  const root = document.documentElement;
  if (!root) {
    return;
  }

  fallbackProps.add(name);
  root.style.setProperty(name, value);
};

const clearFallbackStyleProp = (name: string): void => {
  if (typeof document === 'undefined' || !fallbackProps.has(name)) {
    return;
  }

  const root = document.documentElement;
  if (!root) {
    return;
  }

  root.style.removeProperty(name);
  fallbackProps.delete(name);
};

export const setRuntimeCssVar = (name: string, value: string): void => {
  const rule = findRuntimeRule();

  const propName = name.startsWith('--') ? name : `--${name}`;
  if (!rule) {
    setFallbackStyleProp(propName, value);
    return;
  }

  try {
    rule.style.setProperty(propName, value);
    clearFallbackStyleProp(propName);
  } catch {
    cachedRule = null;
    cachedSheetCount = null;
    setFallbackStyleProp(propName, value);
  }
};

export const setRuntimeCssVars = (
  vars: Record<string, string | number>
): void => {
  const rule = findRuntimeRule();

  Object.entries(vars).forEach(([name, value]) => {
    const propName = name.startsWith('--') ? name : `--${name}`;
    const normalizedValue = typeof value === 'number' ? `${value}` : value;
    if (!rule) {
      setFallbackStyleProp(propName, normalizedValue);
      return;
    }

    try {
      rule.style.setProperty(propName, normalizedValue);
      clearFallbackStyleProp(propName);
    } catch {
      cachedRule = null;
      cachedSheetCount = null;
      setFallbackStyleProp(propName, normalizedValue);
    }
  });
};

export const resetRuntimeCssVarsCache = (): void => {
  cachedRule = null;
  cachedSheetCount = null;
  lastSearchAt = 0;
  fallbackProps.clear();
};
