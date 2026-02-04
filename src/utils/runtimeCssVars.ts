const RUNTIME_VARS_SELECTOR = 'html[data-runtime-vars]';

let cachedRule: CSSStyleRule | null = null;

const findRuntimeRule = (): CSSStyleRule | null => {
  if (cachedRule) {
    return cachedRule;
  }

  if (typeof document === 'undefined') {
    return null;
  }

  for (const sheet of Array.from(document.styleSheets)) {
    let rules: CSSRuleList;
    try {
      rules = sheet.cssRules;
    } catch {
      continue;
    }

    for (const rule of Array.from(rules)) {
      if (rule.type !== CSSRule.STYLE_RULE) {
        continue;
      }

      const styleRule = rule as CSSStyleRule;
      if (styleRule.selectorText === RUNTIME_VARS_SELECTOR) {
        cachedRule = styleRule;
        return styleRule;
      }
    }
  }

  return null;
};

export const setRuntimeCssVar = (name: string, value: string): void => {
  const rule = findRuntimeRule();
  if (!rule) {
    return;
  }

  const propName = name.startsWith('--') ? name : `--${name}`;
  rule.style.setProperty(propName, value);
};

export const setRuntimeCssVars = (
  vars: Record<string, string | number>
): void => {
  const rule = findRuntimeRule();
  if (!rule) {
    return;
  }

  Object.entries(vars).forEach(([name, value]) => {
    const propName = name.startsWith('--') ? name : `--${name}`;
    rule.style.setProperty(
      propName,
      typeof value === 'number' ? `${value}` : value
    );
  });
};

export const resetRuntimeCssVarsCache = (): void => {
  cachedRule = null;
};
