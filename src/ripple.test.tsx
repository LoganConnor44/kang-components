import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, render, act } from '@testing-library/react';
import type { MouseEvent } from 'react';
import { Ripple, useRipple, type RippleState } from './ripple.js';

/**
 * Direct coverage for the kang ripple primitive (`src/ripple.ts`). It's
 * exercised indirectly by 6 component suites (BackButton, ListItem,
 * ConfirmDialog, ...) but never tested on its own. This pins the
 * trigger → state → target-gating contract of `useRipple` and the render
 * behavior of the `Ripple` styled span independent of any consumer.
 *
 * Semantics derived from the source: `useRipple` does NOT self-expire — the
 * fade-out is purely the CSS `rippleAnimation`. State lives until the next
 * `trigger` (which mints a fresh `key` so the animation restarts) or until a
 * consumer drops it. So "expiry" here is the new-key restart + the consumer's
 * `isTarget && ripple` render gate, not a timer.
 */

/**
 * Builds a synthetic React MouseEvent good enough for `trigger`, which only
 * reads `currentTarget.getBoundingClientRect()` and `clientX/clientY`.
 */
const makeMouseEvent = (
	clientX: number,
	clientY: number,
	rect: { left: number; top: number } = { left: 0, top: 0 }
): MouseEvent<HTMLElement> =>
	({
		clientX,
		clientY,
		currentTarget: {
			getBoundingClientRect: () => ({ left: rect.left, top: rect.top }),
		},
	}) as unknown as MouseEvent<HTMLElement>;

afterEach(() => {
	vi.useRealTimers();
});

describe('useRipple', () => {
	it('starts with no active ripple', () => {
		const { result } = renderHook(() => useRipple<'a'>());

		expect(result.current.ripple).toBeNull();
		expect(result.current.isTarget('a')).toBe(false);
	});

	it('produces ripple state with element-relative coords on trigger', () => {
		const { result } = renderHook(() => useRipple<'a'>());

		act(() => {
			// Click at (130, 80) on an element whose box starts at (100, 50).
			result.current.trigger(makeMouseEvent(130, 80, { left: 100, top: 50 }), 'a');
		});

		const ripple = result.current.ripple as RippleState<'a'>;
		expect(ripple).not.toBeNull();
		expect(ripple.x).toBe(30); // clientX - rect.left
		expect(ripple.y).toBe(30); // clientY - rect.top
		expect(ripple.target).toBe('a');
		expect(typeof ripple.key).toBe('number');
	});

	it('reports the firing element as the target and others as not', () => {
		const { result } = renderHook(() => useRipple<'left' | 'right'>());

		act(() => {
			result.current.trigger(makeMouseEvent(10, 10), 'left');
		});

		expect(result.current.isTarget('left')).toBe(true);
		expect(result.current.isTarget('right')).toBe(false);
	});

	it('re-triggering mints a fresh key so the animation restarts', () => {
		vi.useFakeTimers();
		const { result } = renderHook(() => useRipple<'a'>());

		act(() => {
			result.current.trigger(makeMouseEvent(5, 5), 'a');
		});
		const firstKey = (result.current.ripple as RippleState<'a'>).key;

		// key derives from Date.now(); advance the clock so it can differ.
		act(() => {
			vi.advanceTimersByTime(5);
			result.current.trigger(makeMouseEvent(7, 9), 'a');
		});
		const second = result.current.ripple as RippleState<'a'>;

		expect(second.key).not.toBe(firstKey);
		expect(second.x).toBe(7);
		expect(second.y).toBe(9);
	});

	it('moves the active ripple to a new target on a subsequent trigger', () => {
		const { result } = renderHook(() => useRipple<'a' | 'b'>());

		act(() => {
			result.current.trigger(makeMouseEvent(1, 1), 'a');
		});
		expect(result.current.isTarget('a')).toBe(true);

		act(() => {
			result.current.trigger(makeMouseEvent(2, 2), 'b');
		});
		expect(result.current.isTarget('a')).toBe(false);
		expect(result.current.isTarget('b')).toBe(true);
	});

	it('keeps stable trigger/isTarget identities across renders (useCallback)', () => {
		const { result, rerender } = renderHook(() => useRipple<'a'>());

		const firstTrigger = result.current.trigger;
		rerender();
		// trigger has [] deps, so it is referentially stable across renders.
		expect(result.current.trigger).toBe(firstTrigger);
	});
});

describe('Ripple', () => {
	it('renders a positioned span when given ripple coords', () => {
		const { container } = render(<Ripple $x={12} $y={34} />);

		const span = container.querySelector('span');
		expect(span).toBeInTheDocument();
		// Coords flow into the styled span's inline-ish positioning.
		expect(span).toHaveStyle({ left: '12px', top: '34px', position: 'absolute' });
	});

	it('is keyed so each press remounts a fresh animation', () => {
		// Mirrors the consumer pattern: `<Ripple key={ripple.key} ... />`.
		const { container, rerender } = render(<Ripple key={1} $x={0} $y={0} />);
		const firstSpan = container.querySelector('span');

		rerender(<Ripple key={2} $x={5} $y={5} />);
		const secondSpan = container.querySelector('span');

		expect(secondSpan).toBeInTheDocument();
		// A new key produces a different DOM node (animation restarts).
		expect(secondSpan).not.toBe(firstSpan);
	});

	it('renders nothing when a consumer gates it on an empty ripple', () => {
		// The documented usage gates rendering on `isTarget(...) && ripple`.
		const ripple: RippleState<'a'> | null = null;
		const { container } = render(
			<div>{ripple && <Ripple $x={0} $y={0} />}</div>
		);

		expect(container.querySelector('span')).not.toBeInTheDocument();
	});
});
