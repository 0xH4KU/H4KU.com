# Anti-Theft Protection System

_Summary of the layered defenses that deter unauthorized copying, deployment, and redistribution._

## Overview

The protection system consists of **4 layers** combining visible deterrents and hidden tracking mechanisms:

1. **Enhanced Integrity Verification** - Cryptographic content validation
2. **Digital Fingerprinting** - Hidden traceable markers
3. **Code Protection** - Obfuscation and anti-debugging
4. **Domain Verification** - Runtime authorization checks

## Layer 1: Enhanced Integrity Verification

### Features
- **Dual-algorithm hashing**: FNV-1a (legacy) + SHA-256 (enforced)
- **Build-time checksum refresh**: Automatic dual-hash computation
- **Runtime verification**: `StatusBar` renders SHA-256 status + details
- **CLI enforcement**: `integrity:check --write` refreshes both hashes together

### Files
- `src/utils/integrity.ts` - Hash computation and verification
- `src/utils/signature.ts` - Component signing system
- `scripts/build-data.js` - Build-time hash generation

### Usage
```bash
# Check integrity of aggregated content
npm run integrity:check

# Build with integrity hashing (automatic)
npm run build
```

### How it Works
1. `scripts/build-data.js` recalculates both hashes and writes `_integrity` + `_integritySHA256`
2. `scripts/check-integrity.ts` compares both hashes and updates them atomically with `--write`
3. `src/data/mockData.ts` recomputes both hashes at runtime and exposes the results
4. `StatusBar` surfaces SHA-256 status plus the legacy FNV comparison for auditing

## Layer 2: Digital Fingerprinting

### Features
- **DOM watermarks**: Comment nodes + `meta[name="build-id"]` stamped with ID/timestamp/signature
- **Zero-width encodings**: `body[data-fingerprint]` carries a hidden token tied to the build signature
- **CSS fingerprints**: Custom properties drive an invisible animation recordable via DevTools
- **Global manifest**: `.build-manifest.json` logs every injected fingerprint + machine metadata

### Files
- `src/utils/fingerprint.ts` - Fingerprint generation and injection
- `scripts/inject-fingerprint.js` - Build-time fingerprint creation
- `.build-manifest.json` - Historical build records (auto-generated)

### Usage
```bash
# Inject fingerprint (runs automatically before build)
npm run fingerprint:inject

# Full build with fingerprinting
npm run build
```

### How it Works
1. `npm run fingerprint:inject` emits `VITE_BUILD_*` env vars and appends to `.build-manifest.json`
2. Vite injects the fingerprint into `__BUILD_FINGERPRINT__`, making it available at runtime
3. `injectAllFingerprints` writes to the DOM comment, meta tag, `body` data attributes, CSS variables, and `window.__LUM_BUILD_FINGERPRINT__`
4. Console banner reads the active fingerprint so leaked builds can be tied back to a manifest entry

### Fingerprint Extraction
To verify a build's fingerprint:
```javascript
// In browser console
const meta = document.querySelector('meta[name="build-id"]');
console.log('Build ID:', meta?.getAttribute('content'));
console.log('Timestamp:', meta?.getAttribute('data-timestamp'));
console.log('Signature:', meta?.getAttribute('data-signature'));
console.log('Runtime fingerprint:', window.__LUM_BUILD_FINGERPRINT__);
```

## Layer 3: Code Protection

### Features
- **Deterministic hashed artifacts**: Production chunks/assets emit `[hash].js`/`[hash][ext]`
- **Terser hardening**: Toplevel mangling + 3 pass compression + debugger stripping
- **Source map control**: Disabled in production bundles
- **Manual chunk boundaries**: React, framer-motion, and icon vendors isolated

### Files
- `vite.config.ts` - Build and obfuscation configuration

### How it Works
1. The build pipeline now uses `terser` instead of the default esbuild minifier
2. Toplevel mangling obfuscates exported identifiers while multiple compression passes remove dead code
3. Source maps remain enabled only in development builds
4. Manual chunking isolates large dependencies to keep the hardened application bundle compact

## Layer 4: Domain Verification and Copyright Enforcement

### Features
- **Exact-match domain whitelist**: Only explicit host entries or regex entries are accepted
- **Runtime verification**: Unauthorized hosts set the app into a locked state
- **Non-dismissible warning overlay**: Full-screen legal notice with Cloudflare-style lock
- **Console copyright notice**: Displays fingerprint metadata + enforcement notice
- **StatusBar license link**: Visible LPSL-1.0 badge + integrity state

### Files
- `src/utils/domainCheck.ts` - Domain verification logic
- `src/utils/consoleCopyright.ts` - Console banner and warnings
- `src/components/common/CopyrightWarning.tsx` - Warning overlay
- `src/components/layout/StatusBar.tsx` - License badge

### Authorized Domains
Default authorized domains (edit in `src/utils/domainCheck.ts`):
```typescript
const AUTHORIZED_DOMAINS = [
  'localhost',
  '127.0.0.1',
  'lum.bio',
  'www.lum.bio',
  'lum-bio.pages.dev',
  /.*\.lum-bio\.pages\.dev$/,
];
```

### How it Works
1. On app load, `verifyDomain()` compares `window.location.hostname` to the whitelist
2. Unauthorized domains:
   - Trigger a console escalation banner with the active fingerprint
   - Render a non-dismissible overlay + blur/lock the underlying UI
   - Add `body.domain-locked` to kill scrolling and pointer events
3. Authorized domains render normally; dev builds log a lightweight notice

### Adding Authorized Domains
Edit `src/utils/domainCheck.ts`:
```typescript
const AUTHORIZED_DOMAINS = [
  // ... existing domains
  'your-domain.com',
  /.*\.your-preview-domain\.com$/,  // Regex for subdomains
];
```


## Console Copyright Notice

### Production Mode
Displays full ASCII art banner with:
- Copyright and license information
- Restrictions and permissions
- Build ID and signature
- Contact information for licensing

### Development Mode
Minimal notice showing license type


## Build Process

The complete build process with all protections:

```bash
# Full production build
npm run build
```

This runs:
1. `npm run sync` - Content aggregation (CMS)
2. `npm run fingerprint:inject` - Generate and inject build fingerprint
3. `vite build` - Build with obfuscation and hashing


## Testing Protection Features

### Test Domain Verification
1. Temporarily add a test domain to the unauthorized list
2. Run dev server: `npm run dev`
3. Navigate to `localhost:5173`
4. Warning overlay should appear

### Test Fingerprint Injection
```bash
# Generate fingerprint
npm run fingerprint:inject

# Check generated environment file
cat .env.production.local
```

### Test Integrity Verification
```bash
# Build data with hashes
npm run build:data

# Verify integrity
npm run integrity:check
```

### Test Console Notice
1. Build for production: `npm run build`
2. Preview build: `npm run preview`
3. Open browser console
4. Full copyright notice should appear


## Security Considerations

### What This System Protects Against
- Direct code cloning and redeployment
- Content scraping and republishing
- UI or design copying without attribution
- Unauthorized commercial use

### What This System Does Not Protect Against
- Determined adversaries with significant time and skill
- Complete rewrites of functionality
- Legal circumvention (enforcement still requires formal action)
- Screenshot or purely visual copying

### Best Practices
1. **Keep your authorized domain list private** - Don't commit production domains to public repos
2. **Monitor build manifests** - Check `.build-manifest.json` for unauthorized builds
3. **Regular integrity checks** - Run `npm run integrity:check` periodically
4. **Update fingerprints** - Regenerate on each deployment
5. **Legal backing** - Ensure LICENSE.md is clear and enforceable


## Maintenance

### Updating Authorized Domains
Edit `src/utils/domainCheck.ts` and rebuild.

### Rotating Build Fingerprints
Fingerprints are automatically generated on each build. No manual rotation needed.

### Updating Copyright Year
Automatically uses `new Date().getFullYear()` in StatusBar and console notice.

### Disabling Protections (Development)
Most protections are automatically disabled in development mode (`import.meta.env.DEV`).

To disable domain checking temporarily:
```typescript
// In src/utils/domainCheck.ts
export const verifyDomain = (): DomainCheckResult => {
  return { isAuthorized: true, currentDomain: 'dev' }; // Always pass
};
```


## Legal Notice

This protection system is a **technical supplement** to legal protection (LPSL-1.0 license). It provides:

1. **Deterrence** - Makes unauthorized use more difficult and risky
2. **Detection** - Fingerprints enable tracking of stolen copies
3. **Evidence** - Build manifests and fingerprints can support legal claims

**However**, technical measures alone are not sufficient. Always:
- Maintain clear licensing (LICENSE.md)
- Include copyright notices
- Be prepared to take legal action if needed


## Troubleshooting

### "Tamper detected" in StatusBar
**Cause**: Content integrity mismatch
**Fix**: Run `npm run integrity:check` to regenerate hashes

### Warning overlay on localhost
**Cause**: `localhost` not in authorized domain list
**Fix**: Add to `AUTHORIZED_DOMAINS` in `src/utils/domainCheck.ts`

### Build fingerprint not injected
**Cause**: Script not running before build
**Fix**: Ensure `package.json` build script includes `npm run fingerprint:inject`

### Console copyright not showing
**Cause**: Not in production mode
**Fix**: Run `npm run build && npm run preview` instead of `npm run dev`


## Summary

| Layer | Visible | Hidden | Effectiveness |
|-------|---------|--------|---------------|
| 1. Integrity Verification | ✅ Status indicator | ❌ Hash values | Medium |
| 2. Digital Fingerprinting | ❌ | ✅ DOM/CSS markers | High (forensic) |
| 3. Code Protection | ❌ | ✅ Obfuscation | Medium |
| 4. Domain Verification | ✅ Warning overlay | ❌ | High (deterrent) |

**Total Implementation**: ~2-3 hours
**Maintenance Overhead**: Minimal (automatic)
**Performance Impact**: < 50ms initialization


## Support

For questions or issues related to the anti-theft protection system:
1. Check this documentation
2. Review source code comments
3. Open an issue at the repository

**Remember**: Technical protection is part of a comprehensive strategy including legal, licensing, and community efforts.
