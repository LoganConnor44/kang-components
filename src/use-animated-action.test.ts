import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAnimatedAction } from './use-animated-action.js';

/**
 * Unit coverage for the useAnimatedAction hook. It delays an action callback by
 * a configurable amount (default 180ms) so visual feedback can be perceived
 * before the UI transitions away, tracks every pending setTimeout handle in a
 * ref, and clears all of them on unmount to avoid late fires / timer leaks.
 *
 * The hook schedules via setTimeout, so we drive the clock with fake timers and
 * advance past the delay window inside act().
 */

const DEFAULT_DELAY_MS = 180;

beforeEach(() => {
	vi.useFakeTimers();
});

afterEach(() => {
	vi.useRealTimers();
});

describe('useAnimatedAction', () => {
	it('fires the queued callback after the default delay', () => {
		const { result } = renderHook(() => useAnimatedAction());
		const callback = vi.fn();

		act(() => {
			result.current(callback);
		});

		expect(callback).not.toHaveBeenCalled();

		act(() => {
			vi.advanceTimersByTime(DEFAULT_DELAY_MS);
		});

		expect(callback).toHaveBeenCalledTimes(1);
	});

	it('does NOT fire the callback before the delay elapses', () => {
		const { result } = renderHook(() => useAnimatedAction());
		const callback = vi.fn();

		act(() => {
			result.current(callback);
		});

		act(() => {
			vi.advanceTimersByTime(DEFAULT_DELAY_MS - 1);
		});

		expect(callback).not.toHaveBeenCalled();

		act(() => {
			vi.advanceTimersByTime(1);
		});

		expect(callback).toHaveBeenCalledTimes(1);
	});

	it('honors a custom delayMs argument', () => {
		const customDelay = 500;
		const { result } = renderHook(() => useAnimatedAction(customDelay));
		const callback = vi.fn();

		act(() => {
			result.current(callback);
		});

		// Past the default delay, but not the custom one — must not have fired.
		act(() => {
			vi.advanceTimersByTime(DEFAULT_DELAY_MS);
		});

		expect(callback).not.toHaveBeenCalled();

		act(() => {
			vi.advanceTimersByTime(customDelay - DEFAULT_DELAY_MS);
		});

		expect(callback).toHaveBeenCalledTimes(1);
	});

	it('clears all pending timeouts on unmount (no late fire)', () => {
		const { result, unmount } = renderHook(() => useAnimatedAction());
		const callback = vi.fn();

		act(() => {
			result.current(callback);
		});

		unmount();

		act(() => {
			vi.advanceTimersByTime(DEFAULT_DELAY_MS * 10);
		});

		expect(callback).not.toHaveBeenCalled();
	});

	it('clears multiple pending timeouts on unmount', () => {
		const { result, unmount } = renderHook(() => useAnimatedAction());
		const first = vi.fn();
		const second = vi.fn();
		const third = vi.fn();

		act(() => {
			result.current(first);
			result.current(second);
			result.current(third);
		});

		unmount();

		act(() => {
			vi.advanceTimersByTime(DEFAULT_DELAY_MS * 10);
		});

		expect(first).not.toHaveBeenCalled();
		expect(second).not.toHaveBeenCalled();
		expect(third).not.toHaveBeenCalled();
	});

	it('tracks and fires multiple queued actions', () => {
		const { result } = renderHook(() => useAnimatedAction());
		const first = vi.fn();
		const second = vi.fn();
		const third = vi.fn();

		act(() => {
			result.current(first);
			result.current(second);
			result.current(third);
		});

		act(() => {
			vi.advanceTimersByTime(DEFAULT_DELAY_MS);
		});

		expect(first).toHaveBeenCalledTimes(1);
		expect(second).toHaveBeenCalledTimes(1);
		expect(third).toHaveBeenCalledTimes(1);
	});

	it('keeps the act callback identity stable across re-renders with the same delay', () => {
		const { result, rerender } = renderHook(
			({ delay }) => useAnimatedAction(delay),
			{ initialProps: { delay: 180 } }
		);

		const firstAct = result.current;
		rerender({ delay: 180 });

		expect(result.current).toBe(firstAct);
	});
});
