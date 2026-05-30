// Minimal document stub for react-router during SSR/prerender
// react-router's getUrlBasedHistory reads document.defaultView which is undefined in Node
if (typeof globalThis.document === 'undefined') {
  const noop = () => undefined as any
  const stubDoc = {
    defaultView: {
      history: { pushState: noop, replaceState: noop, go: noop, back: noop, forward: noop },
      location: { href: '/', pathname: '/', search: '', hash: '' },
      addEventListener: noop,
      removeEventListener: noop,
    },
    createElement: () => ({}),
    head: { appendChild: noop },
    body: { appendChild: noop },
    getElementById: noop,
    querySelector: noop,
    querySelectorAll: noop,
  }
  ;(globalThis as any).document = stubDoc
  ;(globalThis as any).window = stubDoc.defaultView
}
