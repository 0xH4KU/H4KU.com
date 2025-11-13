# CI/CD Quick Start Guide

Quick reference for developers using the new CI/CD system.

## 🚀 TL;DR

Before pushing your code:

```bash
npm run ci
```

This runs all the same checks that CI will run.

## 📋 Quick Commands

| What you want to do | Command |
|---------------------|---------|
| Check everything before push | `npm run ci` |
| Just quality checks | `npm run ci:quality` |
| Just tests + coverage | `npm run ci:coverage` |
| Just security scan | `npm run ci:security` |
| Just bundle size | `npm run ci:bundle` |
| Format your code | `npm run format` |
| Check formatting | `npm run format:check` |
| Fix lint issues | `npm run lint:fix` |

## 🎯 Pre-Push Checklist

1. ✅ `npm run ci` passes locally
2. ✅ All files are formatted (`npm run format`)
3. ✅ No TypeScript errors
4. ✅ Tests pass with good coverage
5. ✅ Commit messages are clear

## 🔍 Understanding CI Failures

### "Coverage threshold not met"
```bash
# Check what's not covered
npm run test:coverage
open coverage/index.html
```

### "Lint errors"
```bash
# Auto-fix what can be fixed
npm run lint:fix

# Then fix remaining issues manually
npm run lint
```

### "Format check failed"
```bash
# Auto-format all files
npm run format

# Verify
npm run format:check
```

### "Type errors"
```bash
# See detailed errors
npm run type-check
```

### "Bundle size exceeded"
```bash
# Analyze what's in the bundle
npm run size:analyze

# See detailed breakdown
npm run ci:bundle
```

## 🌐 CI Platforms

### GitHub Actions
- **Location**: Actions tab in GitHub
- **Triggers**: Push to main/develop, PRs
- **Duration**: ~3-5 minutes
- **Artifacts**: Coverage reports, build output

### GitLab CI
- **Location**: CI/CD → Pipelines
- **Triggers**: Push to main/develop, MRs
- **Duration**: ~3-5 minutes
- **Artifacts**: Coverage reports, build output

## 📊 What CI Checks

### 1. Quality (runs in parallel)
- ✅ ESLint (code style)
- ✅ Prettier (formatting)
- ✅ TypeScript (type safety)
- ✅ Tests + Coverage (functionality)

### 2. Security
- ✅ `npm run ci:security` (npm audit + audit-ci + secret scan, warnings only)
- ✅ CodeQL (code security - GitHub only)

### 3. Build
- ✅ Production build
- ✅ Bundle size check
- ✅ Asset optimization

## 🆘 Common Issues

### CI passes locally but fails on GitHub/GitLab

**Possible causes:**
1. Different Node.js version
2. Missing environment variables
3. Cached dependencies
4. Race conditions in tests

**Solutions:**
```bash
# Match CI Node version
nvm use 20

# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Run tests in CI mode
CI=true npm run test:run
```

### Tests are flaky

**Common fixes:**
- Use `vi.useFakeTimers()` for time-dependent tests
- Wrap state updates in `act()`
- Use `waitFor()` for async operations
- Avoid `setTimeout` in tests

### Coverage dropped unexpectedly

**Quick fix:**
```bash
# Generate coverage report
npm run test:coverage

# Find uncovered files
open coverage/index.html

# Add tests or exclude file in vitest.config.ts
```

## 🔐 Required Secrets/Variables

### GitHub Secrets
Settings → Secrets and variables → Actions

- `VITE_EMAILJS_SERVICE_ID`
- `VITE_EMAILJS_TEMPLATE_ID`
- `VITE_EMAILJS_PUBLIC_KEY`
- `CODECOV_TOKEN` (optional)

### GitLab Variables
Settings → CI/CD → Variables

- `VITE_EMAILJS_SERVICE_ID`
- `VITE_EMAILJS_TEMPLATE_ID`
- `VITE_EMAILJS_PUBLIC_KEY`

## 📚 Learn More

- **Full Guide**: [CI_CD_GUIDE.md](./CI_CD_GUIDE.md)
- **Badges**: [CI_BADGES.md](./CI_BADGES.md)
- **Summary**: [CI_IMPROVEMENTS_SUMMARY.md](./CI_IMPROVEMENTS_SUMMARY.md)
- **Testing**: [../TESTING.md](../TESTING.md)

## 💡 Pro Tips

1. **Run CI locally before pushing** – catches issues early
2. **Use watch mode during development** – `npm test`
3. **Check coverage regularly** – `npm run test:coverage`
4. **Monitor bundle size** – `npm run size`
5. **Keep dependencies updated** – review Dependabot/Renovate PRs
6. **Read CI logs** – they contain helpful debugging info

## 🎓 Development Workflow

```bash
# 1. Start development
git checkout -b feature/my-feature
npm run dev

# 2. Make changes (keep tests running)
npm test  # in separate terminal

# 3. Before committing
npm run format
npm run ci:quality

# 4. Commit
git add .
git commit -m "feat: add my feature"

# 5. Before pushing
npm run ci

# 6. Push
git push origin feature/my-feature

# 7. Create PR/MR
# CI will run automatically
```

## ⚡ Speed Tips

**Faster local checks:**
```bash
# Skip bundle build during development
npm run ci:quality  # Just lint, format, type-check

# Skip coverage calculation
npm run test:run    # Faster than test:coverage
```

**Faster CI runs:**
- Keep dependencies updated (better caching)
- Write focused tests (faster execution)
- Use parallel jobs (already configured)
- Cache node_modules (already configured)

## 🎯 Quality Standards

- **Coverage**: ≥ 70% for all metrics
- **Bundle Size**: Within defined limits
- **Security**: Zero high/critical vulnerabilities
- **Type Safety**: Zero TypeScript errors
- **Formatting**: 100% Prettier compliance
- **Linting**: Zero ESLint errors

## 📞 Get Help

1. Check [CI_CD_GUIDE.md](./CI_CD_GUIDE.md) troubleshooting section
2. Review CI logs on GitHub/GitLab
3. Run locally with verbose output: `npm run test:run -- --reporter=verbose`
4. Ask team members
5. Create an issue with logs and reproduction steps

---

**Remember**: CI is your friend! It catches bugs before they reach production. 🎉
