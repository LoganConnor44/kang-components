/**
 * Material-style ripple — a domain-free press-feedback overlay.
 *
 * Two pieces that work together:
 * - `useRipple<T>()` — a pure React hook that tracks the active ripple's
 *   position and which target fired it. `trigger(event, target)` records the
 *   click point relative to the element; `isTarget(value)` tells a given
 *   element whether it owns the current ripple.
 * - `Ripple` — a styled `<span>` placed inside the (relatively-positioned)
 *   pressable element. Give it `key={ripple.key}` so each press restarts the
 *   animation, and `$x`/`$y` from the ripple state.
 *
 * The fill reads `theme.colors.ripple` (a generic styling token, not app
 * domain) and falls back to `rgba(0, 0, 0, 0.1)` when absent — so it works with
 * or without a themed `ThemeProvider`.
 *
 * `styled-components` is an optional peer dependency, used only by this module;
 * consumers that import only the press / action-sheet string primitives never
 * pull it in.
 */

import { useCallback, useState, type MouseEvent } from 'react';
import styled, { keyframes } from 'styled-components';

export interface RippleState<T> {
	x: number;
	y: number;
	key: number;
	target: T;
}

export const rippleAnimation = keyframes`
	0% {
		transform: scale(0);
		opacity: 0.6;
	}
	100% {
		transform: scale(10);
		opacity: 0;
	}
`;

export const Ripple = styled.span<{ $x: number; $y: number }>`
	position: absolute;
	left: ${({ $x }) => $x}px;
	top: ${({ $y }) => $y}px;
	width: 50px;
	height: 50px;
	margin-left: -25px;
	margin-top: -25px;
	border-radius: 50%;
	background-color: ${({ theme }) =>
		(theme as { colors?: { ripple?: string } })?.colors?.ripple ?? 'rgba(0, 0, 0, 0.1)'};
	pointer-events: none;
	animation: ${rippleAnimation} 0.4s ease-out forwards;
`;

export function useRipple<T>() {
	const [ripple, setRipple] = useState<RippleState<T> | null>(null);

	const trigger = useCallback((e: MouseEvent<HTMLElement>, target: T) => {
		const rect = e.currentTarget.getBoundingClientRect();
		setRipple({
			x: e.clientX - rect.left,
			y: e.clientY - rect.top,
			key: Date.now(),
			target,
		});
	}, []);

	const isTarget = useCallback(
		(value: T) => ripple !== null && ripple.target === value,
		[ripple]
	);

	return { ripple, trigger, isTarget };
}
