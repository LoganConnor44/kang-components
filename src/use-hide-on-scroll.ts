import { useEffect, useRef, useState } from 'react';

export interface UseHideOnScrollOptions {
	/**
	 * Minimum downward movement (px) accumulated since the last direction flip
	 * before the chrome hides — and the upward movement before it reveals.
	 * Filters out jitter so the bar doesn't flicker. Default 8.
	 */
	threshold?: number;
	/**
	 * The chrome always stays visible while the scroll position is within this
	 * many px of the top, regardless of direction. Default 16.
	 */
	topOffset?: number;
	/**
	 * When false, the hook attaches no listener and always reports visible. Use
	 * to disable auto-hide on views where the bar should be pinned. Default true.
	 */
	enabled?: boolean;
	/**
	 * Optional specific scroll source to observe. When omitted the hook listens
	 * on `window` in the capture phase, so it catches scroll from any nested
	 * overflow container (scroll events don't bubble, but capture still sees them).
	 */
	target?: Window | HTMLElement | null;
}

/**
 * A `scroll` event whose vertical position can't be read from `target.scrollTop`
 * — e.g. a transform/virtualized scroller (content moved via CSS transform inside
 * an `overflow: hidden` box). Such scrollers dispatch a `scroll` CustomEvent
 * carrying their logical position so this hook can react to them like any other.
 */
type ScrollDetail = { scrollTop?: number };

const isDocumentLevel = (t: EventTarget | null): boolean =>
	// window / document / null aren't Elements; documentElement & body are
	// Elements but represent page scroll, so fold them in too. Page scroll fires
	// on different targets across browsers (document vs window) — this collapses
	// them all to one identity.
	!(t instanceof Element) || t === document.documentElement || t === document.body;

/**
 * Collapse the various document-level scroll targets (window / document /
 * documentElement / body — browsers differ on which fires) to a single stable
 * identity so source-change detection doesn't false-positive on the page itself.
 */
const normalizeSource = (t: EventTarget | null): EventTarget =>
	isDocumentLevel(t) ? document : t!;

const scrollTopOf = (target: EventTarget | null): number => {
	if (!isDocumentLevel(target) && typeof (target as HTMLElement).scrollTop === 'number') {
		return (target as HTMLElement).scrollTop;
	}
	return window.scrollY ?? window.pageYOffset ?? 0;
};

const readScrollTop = (event: Event): number => {
	// Transform/virtualized scrollers can't expose scrollTop, so they carry an
	// explicit logical position on the event detail — prefer it when present.
	const detailTop = (event as CustomEvent<ScrollDetail>).detail?.scrollTop;
	if (typeof detailTop === 'number') return detailTop;
	return scrollTopOf(event.target);
};

/**
 * Auto-hiding chrome on scroll: returns `hidden = true` when the user scrolls
 * down (so a floating header / nav bar can slide out of the way) and `false`
 * when they scroll up or return near the top — a common, usability-friendly
 * pattern that keeps content in view while leaving the chrome one flick away.
 *
 * Source-agnostic: by default it observes scroll globally via the capture phase,
 * so a single instance reacts to whichever overflow container the user is
 * scrolling. Changing scroll source (e.g. navigating to another view's list)
 * re-baselines and reveals, so the chrome never gets stuck hidden across views.
 *
 * @returns `true` when the chrome should be hidden, `false` when visible.
 */
export function useHideOnScroll(options: UseHideOnScrollOptions = {}): boolean {
	const { threshold = 8, topOffset = 16, enabled = true, target } = options;
	const [hidden, setHidden] = useState(false);

	const lastYRef = useRef(0);
	const lastSourceRef = useRef<EventTarget | null>(null);

	useEffect(() => {
		if (!enabled || typeof window === 'undefined') {
			setHidden(false);
			return;
		}

		// Seed the baseline at the current document scroll so the first gesture is
		// measured rather than swallowed re-baselining a null source.
		lastSourceRef.current = normalizeSource(target ?? null);
		lastYRef.current = scrollTopOf(target ?? null);

		const handleScroll = (event: Event) => {
			const source = normalizeSource(event.target);
			const y = readScrollTop(event);

			// New scroll source (e.g. a freshly-mounted view's list): re-baseline
			// and reveal rather than carrying the previous view's hidden state over.
			if (source !== lastSourceRef.current) {
				lastSourceRef.current = source;
				lastYRef.current = y;
				setHidden(false);
				return;
			}

			// Near the top → always visible (and keep the baseline current).
			if (y <= topOffset) {
				lastYRef.current = y;
				setHidden(false);
				return;
			}

			const delta = y - lastYRef.current;
			// Only move the baseline on a committed direction change, so slow
			// scrolls accumulate toward the threshold instead of being swallowed.
			if (delta > threshold) {
				lastYRef.current = y;
				setHidden(true);
			} else if (delta < -threshold) {
				lastYRef.current = y;
				setHidden(false);
			}
		};

		// Capture phase + window catches scroll from any nested overflow element,
		// since scroll events don't bubble but do traverse the capture path. When a
		// specific target is given, listen directly on it.
		const listenTarget: Window | HTMLElement = target ?? window;
		const useCapture = !target;
		listenTarget.addEventListener('scroll', handleScroll, useCapture);

		return () => {
			listenTarget.removeEventListener('scroll', handleScroll, useCapture);
		};
	}, [enabled, threshold, topOffset, target]);

	return hidden;
}
