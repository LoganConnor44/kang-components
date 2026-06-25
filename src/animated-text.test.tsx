import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import { render, act, cleanup } from '@testing-library/react';
import { Globals } from '@react-spring/web';
import AnimatedText from './animated-text.js';

/**
 * Unit coverage for AnimatedText — kang's most logic-heavy component, a straddle
 * primitive that shipped with zero tests (issue #18). These assertions pin the
 * real cross-fading cycler behavior derived from the source:
 *
 * Mechanics: a `setTimeout` schedules each cross-fade; when it fires, the spring
 * animates opacity→0 and swaps the visible text in `onRest`, then fades back in.
 * So a swap lands at `delay + (onRest tick)`, and the SAME effect re-arms the next
 * timer because it depends on `cycle`.
 *
 * Timing nuance (pinned deliberately): `FIRST_CYCLE_DELAY` (500ms) only applies
 * when `animate` flips false→true, because `wasAnimating` is initialized to the
 * incoming `animate`. A component that MOUNTS with `animate=true` is NOT "just
 * activated", so its first delay is the steady randomized one (3500..maxDelay).
 *
 * Test rig: react-spring runs in `skipAnimation` mode so the spring resolves
 * deterministically; fake timers drive both the component's `setTimeout` and the
 * spring's onRest tick (advancing a small extra slice flushes the swap). Math.random
 * is pinned to 0 so the steady delay is exactly MIN_DELAY (3500ms).
 */

const MIN_DELAY = 3500;
const FIRST_CYCLE_DELAY = 500;

beforeAll(() => {
	Globals.assign({ skipAnimation: true });
});
afterAll(() => {
	Globals.assign({ skipAnimation: false });
});

beforeEach(() => {
	vi.useFakeTimers();
	// Pin the steady delay to exactly MIN_DELAY: floor(0 * range) + MIN_DELAY.
	vi.spyOn(Math, 'random').mockReturnValue(0);
});
afterEach(async () => {
	// react-spring drives ONE global frameloop; a cycler test left mid-swap can
	// otherwise leave that frameloop wedged against fake timers and stall the NEXT
	// test's onRest. So tear down deterministically: unmount (drops the cycler's
	// effect + its re-armed timer), drain pending fake timers, switch back to real
	// timers, then let the global frameloop fully settle on a real microtask.
	cleanup();
	vi.runOnlyPendingTimers();
	vi.useRealTimers();
	await act(async () => {
		await new Promise((r) => setTimeout(r, 0));
	});
	vi.restoreAllMocks();
});

/** The currently-shown string: the one visible span (the sizers are aria-hidden). */
const visibleText = (c: HTMLElement): string | null | undefined =>
	(
		Array.from(c.querySelectorAll('span')).find(
			(s) => s.getAttribute('aria-hidden') !== 'true'
		) as HTMLElement | undefined
	)?.textContent;

/** The hidden sizer strings, in render order. */
const sizerTexts = (c: HTMLElement): (string | null)[] =>
	Array.from(c.querySelectorAll('span[aria-hidden="true"]')).map((s) => s.textContent);

/**
 * Advance timers by `ms`, then a small extra slice so the spring's onRest tick
 * (which commits the text swap) flushes within the same act boundary.
 */
const advance = async (ms: number) => {
	await act(async () => {
		await vi.advanceTimersByTimeAsync(ms);
	});
	await act(async () => {
		await vi.advanceTimersByTimeAsync(50);
	});
};

describe('AnimatedText', () => {
	describe('variant cycling', () => {
		it('rotates through variants in order on each steady cycle', async () => {
			const { container } = render(
				<AnimatedText variants={['one', 'two', 'three']} animate />
			);
			expect(visibleText(container)).toBe('one');

			await advance(MIN_DELAY);
			expect(visibleText(container)).toBe('two');

			await advance(MIN_DELAY);
			expect(visibleText(container)).toBe('three');

			// Wraps back to the start (cycle % count).
			await advance(MIN_DELAY);
			expect(visibleText(container)).toBe('one');
		});

		it('toggles back and forth in the two-variant case', async () => {
			const { container } = render(<AnimatedText variants={['yes', 'no']} animate />);
			expect(visibleText(container)).toBe('yes');

			await advance(MIN_DELAY);
			expect(visibleText(container)).toBe('no');

			await advance(MIN_DELAY);
			expect(visibleText(container)).toBe('yes');
		});
	});

	describe('timing', () => {
		it('applies FIRST_CYCLE_DELAY (500ms) when animate flips false→true', async () => {
			const { container, rerender } = render(
				<AnimatedText variants={['A', 'B']} animate={false} />
			);
			expect(visibleText(container)).toBe('A');

			// Activate: false → true. wasAnimating was false, so this is "just activated".
			rerender(<AnimatedText variants={['A', 'B']} animate />);

			// Just before the 500ms boundary: no swap yet.
			await act(async () => {
				await vi.advanceTimersByTimeAsync(FIRST_CYCLE_DELAY - 1);
			});
			expect(visibleText(container)).toBe('A');

			// Crossing 500ms triggers the first swap.
			await advance(1);
			expect(visibleText(container)).toBe('B');
		});

		it('uses the steady MIN_DELAY (3500ms), not FIRST_CYCLE_DELAY, when mounted already animating', async () => {
			const { container } = render(<AnimatedText variants={['A', 'B']} animate />);

			// A component mounted with animate=true is NOT "just activated": the
			// first delay is the steady one, so FIRST_CYCLE_DELAY must NOT swap it.
			await act(async () => {
				await vi.advanceTimersByTimeAsync(FIRST_CYCLE_DELAY + 100);
			});
			expect(visibleText(container)).toBe('A');

			// Just before MIN_DELAY: still no swap.
			await act(async () => {
				await vi.advanceTimersByTimeAsync(MIN_DELAY - (FIRST_CYCLE_DELAY + 100) - 1);
			});
			expect(visibleText(container)).toBe('A');

			// Crossing MIN_DELAY performs the swap.
			await advance(1);
			expect(visibleText(container)).toBe('B');
		});

		it('keeps a steady MIN_DELAY cadence for subsequent cycles after activation', async () => {
			const { container, rerender } = render(
				<AnimatedText variants={['A', 'B', 'C']} animate={false} />
			);
			rerender(<AnimatedText variants={['A', 'B', 'C']} animate />);

			// First cycle is fast (FIRST_CYCLE_DELAY).
			await advance(FIRST_CYCLE_DELAY);
			expect(visibleText(container)).toBe('B');

			// Next cycle reverts to the steady cadence: nothing at FIRST_CYCLE_DELAY...
			await act(async () => {
				await vi.advanceTimersByTimeAsync(FIRST_CYCLE_DELAY);
			});
			expect(visibleText(container)).toBe('B');

			// ...but it swaps once MIN_DELAY elapses.
			await advance(MIN_DELAY - FIRST_CYCLE_DELAY);
			expect(visibleText(container)).toBe('C');
		});
	});

	describe('static branch (animate=false)', () => {
		it('holds variants[staticIndex] and schedules no timers', () => {
			const { container } = render(
				<AnimatedText variants={['alpha', 'beta', 'gamma']} animate={false} staticIndex={1} />
			);
			expect(visibleText(container)).toBe('beta');
			expect(vi.getTimerCount()).toBe(0);
		});

		it('defaults staticIndex to 0', () => {
			const { container } = render(
				<AnimatedText variants={['alpha', 'beta']} animate={false} />
			);
			expect(visibleText(container)).toBe('alpha');
		});

		it('falls back to variants[0] when staticIndex is out of range', () => {
			const { container } = render(
				<AnimatedText variants={['alpha', 'beta']} animate={false} staticIndex={9} />
			);
			expect(visibleText(container)).toBe('alpha');
		});

		it('schedules a timer when animating (contrast with the static branch)', () => {
			render(<AnimatedText variants={['a', 'b']} animate />);
			expect(vi.getTimerCount()).toBe(1);
		});
	});

	describe('sizers', () => {
		it('defaults the hidden sizer set to variants', () => {
			const { container } = render(
				<AnimatedText variants={['x', 'yy', 'zzz']} animate={false} />
			);
			expect(sizerTexts(container)).toEqual(['x', 'yy', 'zzz']);
		});

		it('renders the wider provided sizers (not variants) to size the box', () => {
			// Cycled variants are a subset; the sizer set is wider so the box never
			// reflows to a value the variants alone wouldn't cover.
			const { container } = render(
				<AnimatedText
					variants={['hi']}
					sizers={['hi', 'a much wider candidate string']}
					animate={false}
				/>
			);
			const sizers = sizerTexts(container);
			expect(sizers).toEqual(['hi', 'a much wider candidate string']);
			// The visible text is still the variant, independent of the sizer set.
			expect(visibleText(container)).toBe('hi');
		});
	});

	describe('cleanup', () => {
		it('clears the pending timer on unmount', () => {
			const { unmount } = render(<AnimatedText variants={['a', 'b']} animate />);
			expect(vi.getTimerCount()).toBe(1);
			unmount();
			expect(vi.getTimerCount()).toBe(0);
		});

		it('performs no state update (no swap) after unmount', async () => {
			const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
			const { container, unmount } = render(<AnimatedText variants={['a', 'b']} animate />);

			// Unmount before the steady delay elapses, then advance well past it.
			unmount();
			await act(async () => {
				await vi.advanceTimersByTimeAsync(MIN_DELAY * 2);
			});

			// No "update on unmounted component" warning, and nothing left to fire.
			expect(errorSpy).not.toHaveBeenCalled();
			expect(vi.getTimerCount()).toBe(0);
			// The container was emptied by unmount.
			expect(container).toBeEmptyDOMElement();
			errorSpy.mockRestore();
		});
	});

	describe('rendering', () => {
		it('renders the grid as the requested htmlElement (default div)', () => {
			const { container: divContainer } = render(
				<AnimatedText variants={['hi']} animate={false} />
			);
			// Default: the grid is a div using inline-grid layout.
			const div = Array.from(divContainer.querySelectorAll('div')).find(
				(d) => d.style.display === 'inline-grid'
			);
			expect(div).toBeInTheDocument();

			cleanup();

			const { container } = render(
				<AnimatedText variants={['hello']} animate={false} htmlElement="section" />
			);
			const section = container.querySelector('section');
			expect(section).toBeInTheDocument();
			expect(section!.style.display).toBe('inline-grid');
			// The grid still holds the visible text (its first span).
			expect(visibleText(container)).toBe('hello');
		});

		it('marks every sizer span aria-hidden and the visible span not', () => {
			const { container } = render(
				<AnimatedText variants={['a', 'b']} animate={false} />
			);
			const hidden = container.querySelectorAll('span[aria-hidden="true"]');
			const shown = Array.from(container.querySelectorAll('span')).filter(
				(s) => s.getAttribute('aria-hidden') !== 'true'
			);
			expect(hidden.length).toBe(2); // one per sizer (defaults to variants)
			expect(shown.length).toBe(1); // exactly one visible span
		});
	});
});
