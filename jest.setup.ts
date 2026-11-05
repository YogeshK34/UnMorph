import "@testing-library/jest-dom";

// jsdom lacks a few browser APIs that motion / lenis / our hooks rely on.
// (Guarded so suites that opt into `@jest-environment node` still load.)
if (typeof window !== "undefined") {
  class MockObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  }

  Object.defineProperty(window, "IntersectionObserver", { writable: true, value: MockObserver });
  Object.defineProperty(window, "ResizeObserver", { writable: true, value: MockObserver });

  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });

  window.scrollTo = (() => {}) as typeof window.scrollTo;
}
