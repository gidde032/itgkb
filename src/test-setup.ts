import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

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
