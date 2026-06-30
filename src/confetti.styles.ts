import styled, { keyframes } from 'styled-components';

/**
 * Falls from just above the top, drifting sideways and rotating, then fades.
 * Per-piece motion comes from CSS custom properties set inline, all in PIXELS
 * (computed once at burst time) — NOT viewport units. iOS Safari recomputes
 * `vh`/`vw` when its address bar collapses, which desynced/stalled the
 * animation mid-fall; fixed pixel targets avoid that entirely.
 *   --start  starting Y (negative px, above viewport)
 *   --dx     horizontal drift (px)
 *   --dist   fall distance (px, comfortably past the bottom edge)
 *   --rot    rotation (deg)
 */
const fall = keyframes`
	0% {
		transform: translate3d(0, var(--start, -120px), 0) rotateZ(0deg);
		opacity: 0;
	}
	8% {
		opacity: 1;
	}
	100% {
		transform: translate3d(var(--dx, 0), var(--dist, 900px), 0) rotateZ(var(--rot, 360deg));
		opacity: 0;
	}
`;

/**
 * Viewport-fixed overlay. Rendered via a portal to <body> so it sits OUTSIDE
 * any `position: fixed` + `overflow: hidden` + `contain: layout` subtree — that
 * nesting is what froze the piece animations mid-fall on iOS (compositing
 * desync inside a fixed/clipped ancestor during scroll/toolbar settle). At the
 * document root the pieces composite against the viewport and animate to
 * completion.
 */
export const ConfettiLayer = styled.div`
	position: fixed;
	inset: 0;
	overflow: hidden;
	pointer-events: none;
	z-index: 2147483000;
`;

export const ConfettiPiece = styled.span`
	position: absolute;
	top: 0;
	display: block;
	white-space: nowrap;
	user-select: none;
	will-change: transform, opacity;
	animation-name: ${fall};
	animation-timing-function: cubic-bezier(0.25, 0.6, 0.45, 1);
	/* 'both' applies the 0% keyframe during the start delay, so each piece waits
	   above the viewport (opacity 0) instead of sitting visibly at the top. */
	animation-fill-mode: both;
	animation-iteration-count: 1;

	@media (prefers-reduced-motion: reduce) {
		animation: none;
		display: none;
	}
`;
