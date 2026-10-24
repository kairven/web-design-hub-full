import { Component } from 'react';

/**
 * Last line of defence: if anything throws during render we show a
 * recoverable screen instead of a blank page (common on mobile Safari).
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('[zayka] render error', error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
        <img src="/brand/mark.svg" alt="" className="h-14 w-14" />
        <h1 className="mt-5 font-display text-xl font-semibold text-cream">Something went wrong</h1>
        <p className="mt-2 max-w-sm text-[13px] leading-relaxed text-muted">
          The page hit an unexpected problem. Reloading usually fixes it — your cart and login are kept.
        </p>
        <pre className="mt-4 max-w-full overflow-x-auto rounded-lg border border-white/10 bg-ink-850 px-3 py-2 text-left text-[10px] text-chili-400">
          {String(this.state.error?.message || this.state.error).slice(0, 220)}
        </pre>
        <button
          onClick={() => { window.location.reload(); }}
          className="mt-5 inline-flex h-11 items-center rounded-xl bg-gradient-to-b from-saffron-400 to-saffron-600 px-5 text-sm font-bold text-ink-950"
        >
          Reload the app
        </button>
      </div>
    );
  }
}
