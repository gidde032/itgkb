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

// jsdom lacks matchMedia; stub with a test-controllable narrow flag (NF-7 tests).
let narrowViewport = false;
const mqlListeners = new Set<(e: { matches: boolean }) => void>();
(globalThis as Record<string, unknown>).__setNarrowViewport = (v: boolean) => {
  narrowViewport = v;
  for (const l of mqlListeners) l({ matches: v });
};
beforeEach(() => {
  narrowViewport = false;
});
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn((query: string) => ({
    get matches() {
      return narrowViewport;
    },
    media: query,
    addEventListener: (_t: string, l: (e: { matches: boolean }) => void) => mqlListeners.add(l),
    removeEventListener: (_t: string, l: (e: { matches: boolean }) => void) => mqlListeners.delete(l),
    addListener: () => {},
    removeListener: () => {},
    onchange: null,
    dispatchEvent: () => false,
  })),
});
