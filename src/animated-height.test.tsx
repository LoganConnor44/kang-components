import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { AnimatedHeight } from './animated-height.js';

/**
 * AnimatedHeight wraps content in a container that springs its height to match
 * the content as it resizes (via ResizeObserver), with the first measurement
 * applied instantly so there's no open-from-zero flash on mount. jsdom has no
 * ResizeObserver, so we install a controllable mock and drive content-rect
 * heights by hand.
 */

let roCallback: ResizeObserverCallback | null = null;
const observe = vi.fn();
const disconnect = vi.fn();

class MockResizeObserver {
	constructor(cb: ResizeObserverCallback) {
		roCallback = cb;
	}
	observe = observe;
	unobserve = vi.fn();
	disconnect = disconnect;
}

function emitHeight(height: number): void {
	act(() => {
		roCallback?.(
			[{ contentRect: { height } } as ResizeObserverEntry],
			{} as ResizeObserver,
		);
	});
}

function installResizeObserver(): void {
	roCallback = null;
	(globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver =
		MockResizeObserver;
}

afterEach(() => {
	vi.clearAllMocks();
	delete (globalThis as unknown as { ResizeObserver?: unknown }).ResizeObserver;
});

describe('AnimatedHeight', () => {
	it('renders its children', () => {
		installResizeObserver();
		render(<AnimatedHeight><p>hello</p></AnimatedHeight>);
		expect(screen.getByText('hello')).toBeInTheDocument();
	});

	it('observes the content element for size changes', () => {
		installResizeObserver();
		render(<AnimatedHeight><p>content</p></AnimatedHeight>);
		expect(observe).toHaveBeenCalledTimes(1);
	});

	it('clips overflow so collapsing content does not spill', () => {
		installResizeObserver();
		const { container } = render(<AnimatedHeight><p>x</p></AnimatedHeight>);
		const wrapper = container.firstElementChild as HTMLElement;
		expect(wrapper.style.overflow).toBe('hidden');
	});

	it('applies the first measured height immediately (no open-from-zero)', () => {
		installResizeObserver();
		const { container } = render(<AnimatedHeight><p>x</p></AnimatedHeight>);
		const wrapper = container.firstElementChild as HTMLElement;
		// Before any measurement it sizes to auto so content is never clipped.
		expect(wrapper.style.height).toBe('auto');
		emitHeight(120);
		expect(wrapper.style.height).toBe('120px');
	});

	it('disconnects the observer on unmount', () => {
		installResizeObserver();
		const { unmount } = render(<AnimatedHeight><p>x</p></AnimatedHeight>);
		unmount();
		expect(disconnect).toHaveBeenCalled();
	});

	it('degrades to auto height when ResizeObserver is unavailable', () => {
		// No installResizeObserver() — ResizeObserver stays undefined.
		const { container } = render(<AnimatedHeight><p>x</p></AnimatedHeight>);
		const wrapper = container.firstElementChild as HTMLElement;
		expect(wrapper.style.height).toBe('auto');
		expect(screen.getByText('x')).toBeInTheDocument();
	});
});
