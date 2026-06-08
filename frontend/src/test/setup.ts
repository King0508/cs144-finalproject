import "@testing-library/jest-dom/vitest";

// jsdom doesn't implement matchMedia or ResizeObserver — stub them so the
// components under test don't crash.
if (!window.matchMedia) {
  Object.defineProperty(window, "matchMedia", {
    value: () => ({ matches: false, media: "", addListener: () => undefined, removeListener: () => undefined, addEventListener: () => undefined, removeEventListener: () => undefined, dispatchEvent: () => false }),
  });
}
if (!(window as unknown as { ResizeObserver: unknown }).ResizeObserver) {
  (window as unknown as { ResizeObserver: unknown }).ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}
