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
  observe() {}
  unobserve() {}
  disconnect() {}
}
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = ResizeObserverStub as unknown as typeof ResizeObserver;
}
