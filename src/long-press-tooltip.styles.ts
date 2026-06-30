// Named import (not the default) so styled-components resolves consistently
// when this file is consumed as a published node_modules ESM module.
import { styled } from 'styled-components';
import { animated } from '@react-spring/web';

// kang has no global DefaultTheme augmentation; read tokens off props.theme with
// literal fallbacks (matching list-item.styles, ripple.ts, etc.) so the bubble
// still renders sensibly without a themed ThemeProvider.
type ThemeColors = {
	colors?: {
		onSurface?: string;
		surface?: string;
		shadowLight?: string;
	};
};

/**
 * Transparent block wrapper that sits inside a list (e.g. a flex column with no
 * `gap`), so it doesn't alter row spacing. It owns the long-press gesture and
 * suppresses the native callout / text selection that iOS and Android trigger
 * on touch-and-hold.
 */
export const TooltipWrapper = styled.div`
	width: 100%;
	/*
	 * Let the browser keep vertical scrolling, but claim every other gesture
	 * (incl. the press-and-hold) for us. Without this, Chrome on Android
	 * optimistically hands the touch to the compositor and fires pointercancel
	 * before our long-press timer completes — so a still hold "does nothing".
	 */
	touch-action: pan-y;
	-webkit-touch-callout: none;
	-webkit-user-select: none;
	user-select: none;
`;

/**
 * Floating bubble. Uses the inverted scheme (onSurface background / surface
 * text) for consistency with other transient overlays. Portaled to <body> so it
 * escapes any clipped (`overflow: hidden`) ancestor.
 */
export const TooltipPopover = styled(animated.div)`
	position: fixed;
	z-index: 9999;
	box-sizing: border-box;
	max-width: min(20rem, calc(100vw - 2rem));
	padding: 0.75rem 0.875rem;
	border-radius: 12px;
	background: ${({ theme }) => (theme as ThemeColors)?.colors?.onSurface ?? '#1a1a1a'};
	color: ${({ theme }) => (theme as ThemeColors)?.colors?.surface ?? '#ffffff'};
	font-size: 0.8125rem;
	line-height: 1.45;
	box-shadow: 0 8px 24px ${({ theme }) => (theme as ThemeColors)?.colors?.shadowLight ?? 'rgba(0, 0, 0, 0.15)'};
	/* Informational only — taps anywhere dismiss it via a document listener. */
	pointer-events: none;
	will-change: transform, opacity;
`;

/** Small caret that points from the bubble back toward the long-pressed row. */
export const TooltipArrow = styled.div<{ $placement: 'above' | 'below' }>`
	position: absolute;
	left: var(--arrow-left, 1rem);
	${({ $placement }) => ($placement === 'below' ? 'top: -5px;' : 'bottom: -5px;')}
	width: 10px;
	height: 10px;
	background: ${({ theme }) => (theme as ThemeColors)?.colors?.onSurface ?? '#1a1a1a'};
	transform: rotate(45deg);
`;
