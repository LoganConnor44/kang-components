import { useCallback, useRef, useEffect } from 'react';

/**
 * Delays an action callback so that visual feedback (ripple, press animation)
 * has time to be perceived before the UI transitions away.
 *
 * Uses 180ms by default — long enough to see the ripple start expanding,
 * short enough to feel responsive (under the 200ms "instant" threshold).
 *
 * All pending timeouts are cleared on unmount.
 */
const DEFAULT_DELAY_MS = 180;

export function useAnimatedAction(delayMs = DEFAULT_DELAY_MS) {
	const timeoutsRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());

	useEffect(() => {
		return () => {
			for (const id of timeoutsRef.current) {
				clearTimeout(id);
			}
		};
	}, []);

	const act = useCallback(
		(callback: () => void) => {
			const id = setTimeout(() => {
				timeoutsRef.current.delete(id);
				callback();
			}, delayMs);
			timeoutsRef.current.add(id);
		},
		[delayMs]
	);

	return act;
}
