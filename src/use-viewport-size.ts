import { useState, useEffect } from 'react';

export interface ViewportSize {
	width: number;
	height: number;
}

/**
 * Hook to track viewport dimensions with debounced updates.
 * Listens to resize and orientation change events.
 *
 * Ported from ymy-components (`./hooks/useViewportSize`) preserving its public
 * API exactly so xunzi can re-point as a pure import swap.
 *
 * @param debounceMs - Debounce delay in milliseconds (default: 100)
 * @returns ViewportSize - Current viewport width and height
 */
export function useViewportSize(debounceMs = 100): ViewportSize {
	const [size, setSize] = useState<ViewportSize>({
		width: typeof window !== 'undefined' ? window.innerWidth : 0,
		height: typeof window !== 'undefined' ? window.innerHeight : 0,
	});

	useEffect(() => {
		let timeoutId: ReturnType<typeof setTimeout>;

		const handleResize = () => {
			clearTimeout(timeoutId);
			timeoutId = setTimeout(() => {
				setSize({
					width: window.innerWidth,
					height: window.innerHeight,
				});
			}, debounceMs);
		};

		window.addEventListener('resize', handleResize);
		window.addEventListener('orientationchange', handleResize);

		return () => {
			clearTimeout(timeoutId);
			window.removeEventListener('resize', handleResize);
			window.removeEventListener('orientationchange', handleResize);
		};
	}, [debounceMs]);

	return size;
}
