/**
 * Lightweight web-vitals style monitoring without external deps.
 * Uses PerformanceObserver to collect LCP, FID, CLS and emits to a reporter.
 */

type VitalsName = 'LCP' | 'FID' | 'CLS';

type VitalsEntry = {
  name: VitalsName;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  navigationType?: string;
};

const getRating = (name: VitalsName, value: number): VitalsEntry['rating'] => {
  switch (name) {
    case 'LCP':
      if (value <= 2500) return 'good';
      if (value <= 4000) return 'needs-improvement';
      return 'poor';
    case 'FID':
      if (value <= 100) return 'good';
      if (value <= 300) return 'needs-improvement';
      return 'poor';
    case 'CLS':
      if (value <= 0.1) return 'good';
      if (value <= 0.25) return 'needs-improvement';
      return 'poor';
    default:
      return 'needs-improvement';
  }
};

export type VitalsReporter = (entry: VitalsEntry) => void;

const supportable = typeof PerformanceObserver !== 'undefined';

const navigationType = () => {
  const nav = performance.getEntriesByType('navigation')[0] as
    | PerformanceNavigationTiming
    | undefined;
  return nav?.type;
};

export const startWebVitals = (report: VitalsReporter = () => {}) => {
  if (!supportable) return () => {};

  const observers: PerformanceObserver[] = [];

  // Largest Contentful Paint
  const lcpObserver = new PerformanceObserver(list => {
    const entries = list.getEntries();
    const last = entries[entries.length - 1];
    if (!last) return;
    report({
      name: 'LCP',
      value: last.startTime,
      rating: getRating('LCP', last.startTime),
      navigationType: navigationType(),
    });
  });
  lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
  observers.push(lcpObserver);

  // First Input Delay
  const fidObserver = new PerformanceObserver(list => {
    const first = list.getEntries()[0];
    if (
      !first ||
      (first as PerformanceEntry & { processingStart?: number })
        .processingStart === undefined
    )
      return;
    const latency =
      (first as PerformanceEventTiming).processingStart - first.startTime;
    report({
      name: 'FID',
      value: latency,
      rating: getRating('FID', latency),
      navigationType: navigationType(),
    });
  });
  fidObserver.observe({ type: 'first-input', buffered: true });
  observers.push(fidObserver);

  // Cumulative Layout Shift
  let clsValue = 0;
  const clsObserver = new PerformanceObserver(list => {
    for (const entry of list.getEntries()) {
      const shift = entry as PerformanceEntry & {
        value: number;
        hadRecentInput?: boolean;
      };
      if (!shift.hadRecentInput) {
        clsValue += shift.value;
        report({
          name: 'CLS',
          value: clsValue,
          rating: getRating('CLS', clsValue),
          navigationType: navigationType(),
        });
      }
    }
  });
  clsObserver.observe({ type: 'layout-shift', buffered: true });
  observers.push(clsObserver);

  return () => observers.forEach(o => o.disconnect());
};
