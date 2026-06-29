import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useHideOnScroll } from './use-hide-on-scroll.js';

/**
 * Coverage for the generic hide-on-scroll primitive: a header / floating bar
 * hides when the user scrolls down (past a small threshold) and reveals again
 * the moment they scroll up — the common "auto-hiding chrome" UX. The hook is
 * source-agnostic: it listens on the capture phase so it catches scroll from any
 * nested overflow container, not just window.
 *
 * Scroll position is read from the event target (`scrollTop` for elements,
 * `window.scrollY` for the document), so the tests drive it by mutating those
 * and dispatching a `scroll` event.
 */

const setWindowScroll = (y: number) => {
	// window.scrollY / pageYOffset are read-only accessors in jsdom — redefine them.
	Object.defineProperty(window, 'scrollY', { value: y, configurable: true });
	Object.defineProperty(window, 'pageYOffset', { value: y, configurable: true });
};

const scrollWindowTo = (y: number) => {
	act(() => {
		setWindowScroll(y);
		window.dispatchEvent(new Event('scroll'));
	});
};

beforeEach(() => {
	setWindowScroll(0);
});

afterEach(() => {
	setWindowScroll(0);
	vi.restoreAllMocks();
});

describe('useHideOnScroll', () => {
	it('starts visible (hidden = false)', () => {
		const { result } = renderHook(() => useHideOnScroll());
		expect(result.current).toBe(false);
	});

	it('hides once the user scrolls down past the threshold', () => {
		const { result } = renderHook(() => useHideOnScroll({ threshold: 8 }));

		scrollWindowTo(100);

		expect(result.current).toBe(true);
	});

	it('reveals again the moment the user scrolls up past the threshold', () => {
		const { result } = renderHook(() => useHideOnScroll({ threshold: 8 }));

		scrollWindowTo(200); // down → hidden
		expect(result.current).toBe(true);

		scrollWindowTo(150); // up → shown
		expect(result.current).toBe(false);
	});

	it('ignores sub-threshold jitter (stays visible)', () => {
		const { result } = renderHook(() => useHideOnScroll({ threshold: 20 }));

		scrollWindowTo(5);
		scrollWindowTo(10); // total +10 < 20 threshold

		expect(result.current).toBe(false);
	});

	it('always reveals when scrolled back near the top (topOffset)', () => {
		const { result } = renderHook(() =>
			useHideOnScroll({ threshold: 8, topOffset: 16 })
		);

		scrollWindowTo(300); // hidden
		expect(result.current).toBe(true);

		// Even with a downward delta, being within topOffset of the top forces show.
		scrollWindowTo(10);
		expect(result.current).toBe(false);
	});

	it('reveals and re-baselines when the scroll source changes (e.g. navigation)', () => {
		const el = document.createElement('div');
		document.body.appendChild(el);

		const { result } = renderHook(() => useHideOnScroll({ threshold: 8 }));

		scrollWindowTo(300); // window scrolled down → hidden
		expect(result.current).toBe(true);

		// A different, freshly-mounted container scrolls — treated as a new source,
		// so the bar reveals rather than staying hidden from the previous view.
		act(() => {
			(el as unknown as { scrollTop: number }).scrollTop = 50;
			el.dispatchEvent(new Event('scroll', { bubbles: false }));
		});
		expect(result.current).toBe(false);

		document.body.removeChild(el);
	});

	it('stays visible and attaches no listener when disabled', () => {
		const addSpy = vi.spyOn(window, 'addEventListener');
		const { result } = renderHook(() => useHideOnScroll({ enabled: false }));

		scrollWindowTo(500);

		expect(result.current).toBe(false);
		expect(addSpy).not.toHaveBeenCalledWith(
			'scroll',
			expect.any(Function),
			expect.anything()
		);
	});

	it('removes its scroll listener on unmount', () => {
		const removeSpy = vi.spyOn(window, 'removeEventListener');
		const { unmount } = renderHook(() => useHideOnScroll());

		unmount();

		expect(removeSpy).toHaveBeenCalledWith(
			'scroll',
			expect.any(Function),
			expect.anything()
		);
	});
});
