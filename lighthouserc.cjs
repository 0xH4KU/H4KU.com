/** @type {import('@lhci/cli').Config} */
module.exports = {
  ci: {
    collect: {
      // Use local preview server
      startServerCommand: 'npm run preview',
      startServerReadyPattern: 'Local:',
      startServerReadyTimeout: 30000,

      // URLs to test
      url: ['http://localhost:4173/', 'http://localhost:4173/page/about'],

      // Number of runs per URL for more consistent results
      numberOfRuns: 3,

      // Desktop preset settings
      settings: {
        preset: 'desktop',
        // Additional desktop-specific settings
        formFactor: 'desktop',
        screenEmulation: {
          mobile: false,
          width: 1350,
          height: 940,
          deviceScaleFactor: 1,
          disabled: false,
        },
        throttling: {
          rttMs: 40,
          throughputKbps: 10240,
          cpuSlowdownMultiplier: 1,
        },
      },
    },

    assert: {
      // Only check our specific assertions, no preset
      assertMatrix: [
        {
          matchingUrlPattern: '.*',
          assertions: {
            // Core category thresholds
            'categories:performance': ['error', { minScore: 0.9 }],
            'categories:accessibility': ['error', { minScore: 0.95 }],
            'categories:best-practices': ['error', { minScore: 0.9 }],
            'categories:seo': ['error', { minScore: 0.9 }],

            // Core Web Vitals (warnings for awareness)
            'first-contentful-paint': ['warn', { maxNumericValue: 2000 }],
            'largest-contentful-paint': ['warn', { maxNumericValue: 2500 }],
            'cumulative-layout-shift': ['warn', { maxNumericValue: 0.1 }],
            'total-blocking-time': ['warn', { maxNumericValue: 300 }],
            'speed-index': ['warn', { maxNumericValue: 3000 }],
          },
        },
      ],
    },

    upload: {
      // Output HTML reports locally
      target: 'filesystem',
      outputDir: '.lighthouseci',
      reportFilenamePattern: '%%PATHNAME%%-%%DATETIME%%-report.%%EXTENSION%%',
    },
  },
};
