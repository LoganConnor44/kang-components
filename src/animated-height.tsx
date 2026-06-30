import { ReactElement, ReactNode, useRef, useEffect, useState } from 'react';
import { useSpring, animated } from '@react-spring/web';
import { SPRING_RESPONSIVE } from './spring.js';

export interface AnimatedHeightProps {
	children: ReactNode;
}

/**
 * Wraps children in a container that smoothly animates height changes.
 * Uses ResizeObserver to detect content size changes and react-spring
 * to animate the container height. First measurement is immediate
 * (no animation); subsequent changes animate with SPRING_RESPONSIVE.
 *
 * Domain-free layout primitive — lives in kang so every app animates
 * expand/collapse with the same physics. Falls back to `auto` height where
 * ResizeObserver is unavailable.
 */
export const AnimatedHeight = ({ children }: AnimatedHeightProps): ReactElement => {
	const contentRef = useRef<HTMLDivElement>(null);
	const initializedRef = useRef(false);
	const [isReady, setIsReady] = useState(false);
	const [spring, api] = useSpring(() => ({ height: 0 }));

	useEffect(() => {
		const el = contentRef.current;
		if (!el || typeof ResizeObserver === 'undefined') return;

		const observer = new ResizeObserver((entries) => {
			const entry = entries[0];
			if (!entry) return;
			const newHeight = entry.contentRect.height;

			if (!initializedRef.current) {
				initializedRef.current = true;
				api.set({ height: newHeight });
				setIsReady(true);
				return;
			}

			api.start({ height: newHeight, config: SPRING_RESPONSIVE });
		});

		observer.observe(el);
		return () => observer.disconnect();
	}, [api]);

	return (
		<animated.div style={{ overflow: 'hidden', height: isReady ? spring.height : 'auto' }}>
			<div ref={contentRef}>
				{children}
			</div>
		</animated.div>
	);
};
