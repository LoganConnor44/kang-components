import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, render, screen, act } from '@testing-library/react';
import { useViewportSize, type ViewportSize } from './use-viewport-size.js';

/**
 * Unit + integration coverage for the ported useViewportSize hook. ymy shipped
 * this untested; this file is the real coverage for the behavior xunzi relies on:
 * initial size from window, debounced updates on resize + orientationchange, and
 * listener cleanup on unmount.
 *
 * The hook debounces via setTimeout (default 100ms), so we drive the clock with
 * fake timers and advance past the debounce window inside act().
 */

const setViewport = (width: number, height: number) => {
	(window as unknown as { innerWidth: number }).innerWidth = width;
	(window as unknown as { innerHeight: number }).innerHeight = height;
};

const originalWidth = window.innerWidth;
const originalHeight = window.innerHeight;

beforeEach(() => {
	vi.useFakeTimers();
	setViewport(1024, 768);
});

afterEach(() => {
	vi.useRealTimers();
	setViewport(originalWidth, originalHeight);
});

describe('useViewportSize', () => {
	it('returns the initial viewport from window.innerWidth/innerHeight', () => {
		const { result } = renderHook(() => useViewportSize());

		expect(result.current).toEqual<ViewportSize>({ width: 1024, height: 768 });
	});

	it('updates on the resize event after the debounce window', () => {
		const { result } = renderHook(() => useViewportSize());

		act(() => {
			setViewport(500, 900);
			window.dispatchEvent(new Event('resize'));
		});

		// Still the old value before the debounce elapses.
		expect(result.current).toEqual({ width: 1024, height: 768 });

		act(() => {
			vi.advanceTimersByTime(100);
		});

		expect(result.current).toEqual({ width: 500, height: 900 });
	});

	it('updates on the orientationchange event', () => {
		const { result } = renderHook(() => useViewportSize());

		act(() => {
			setViewport(812, 375);
			window.dispatchEvent(new Event('orientationchange'));
			vi.advanceTimersByTime(100);
		});

		expect(result.current).toEqual({ width: 812, height: 375 });
	});

	it('respects a custom debounce delay', () => {
		const { result } = renderHook(() => useViewportSize(250));

		act(() => {
			setViewport(640, 480);
			window.dispatchEvent(new Event('resize'));
			vi.advanceTimersByTime(100);
		});

		// Not yet — custom debounce is 250ms.
		expect(result.current).toEqual({ width: 1024, height: 768 });

		act(() => {
			vi.advanceTimersByTime(150);
		});

		expect(result.current).toEqual({ width: 640, height: 480 });
	});

	it('removes its listeners on unmount (no updates after)', () => {
		const removeSpy = vi.spyOn(window, 'removeEventListener');
		const { result, unmount } = renderHook(() => useViewportSize());

		unmount();

		expect(removeSpy).toHaveBeenCalledWith('resize', expect.any(Function));
		expect(removeSpy).toHaveBeenCalledWith(
			'orientationchange',
			expect.any(Function)
		);

		// A resize after unmount must not change the last value.
		act(() => {
			setViewport(200, 200);
			window.dispatchEvent(new Event('resize'));
			vi.advanceTimersByTime(100);
		});

		expect(result.current).toEqual({ width: 1024, height: 768 });
		removeSpy.mockRestore();
	});

	it('exercises the hook inside a component that renders the size', () => {
		function Probe() {
			const { width, height } = useViewportSize();
			return <div data-testid="size">{`${width}x${height}`}</div>;
		}

		render(<Probe />);
		expect(screen.getByTestId('size')).toHaveTextContent('1024x768');

		act(() => {
			setViewport(360, 640);
			window.dispatchEvent(new Event('resize'));
			vi.advanceTimersByTime(100);
		});

		expect(screen.getByTestId('size')).toHaveTextContent('360x640');
	});
});
