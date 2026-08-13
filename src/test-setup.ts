import '@testing-library/jest-dom/vitest';
import { beforeEach, vi } from 'vitest';

// jsdom lacks canvas 2D and ResizeObserver; stub both for component tests.
// A recursive Proxy lets any ctx method chain (e.g. createRadialGradient().addColorStop()).
function makeCtxStub(): unknown {
  const handler: ProxyHandler<Record<string, unknown>> = {
    get(target, prop: string) {
      if (!(prop in target)) {
        target[prop] = vi.fn(() => new Proxy({}, handler));
      }
      return target[prop];
    },
    set(target, prop: string, value) {
      target[prop] = value;
      return true;
    },
  };
  return new Proxy({}, handler);
}

Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  value: vi.fn(() => makeCtxStub()),
  writable: true,
});

class ResizeObserverStub {
  static constructedCount = 0;
  constructor() {
    ResizeObserverStub.constructedCount += 1;
  }
  observe() {}
  unobserve() {}
  disconnect() {}
}
// Exposed for the P3-F1 regression test (setup-teardown churn detector).
(globalThis as Record<string, unknown>).__ResizeObserverStub = ResizeObserverStub;
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = ResizeObserverStub as unknown as typeof ResizeObserver;
}

// jsdom lacks matchMedia; stub with test-controllable narrow / reduced-motion
// flags. Listeners are keyed by query so a change to one flag dispatches every
// registered listener with the matches value correct for ITS OWN query.
let narrowViewport = false;
let reducedMotion = false;
const mqlListeners = new Map<string, Set<(e: { matches: boolean }) => void>>();
function matchesFor(query: string): boolean {
  return query.includes('prefers-reduced-motion') ? reducedMotion : narrowViewport;
}
function dispatchAll() {
  for (const [query, set] of mqlListeners) {
    const m = matchesFor(query);
    for (const l of set) l({ matches: m });
  }
}
(globalThis as Record<string, unknown>).__setNarrowViewport = (v: boolean) => {
  narrowViewport = v;
  dispatchAll();
};
(globalThis as Record<string, unknown>).__setReducedMotion = (v: boolean) => {
  reducedMotion = v;
  dispatchAll();
};
beforeEach(() => {
  narrowViewport = false;
  reducedMotion = false;
});
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn((query: string) => ({
    get matches() {
      return matchesFor(query);
    },
    media: query,
    addEventListener: (type: string, l: (e: { matches: boolean }) => void) => {
      if (type !== 'change') return;
      if (!mqlListeners.has(query)) mqlListeners.set(query, new Set());
      mqlListeners.get(query)!.add(l);
    },
    removeEventListener: (type: string, l: (e: { matches: boolean }) => void) => {
      if (type !== 'change') return;
      mqlListeners.get(query)?.delete(l);
    },
    addListener: () => {},
    removeListener: () => {},
    onchange: null,
    dispatchEvent: () => false,
  })),
});
