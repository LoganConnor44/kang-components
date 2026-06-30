import {
	ReactElement,
	ReactNode,
	useCallback,
	useEffect,
	useLayoutEffect,
	useRef,
	useState,
	type PointerEvent as ReactPointerEvent,
	type MouseEvent as ReactMouseEvent,
} from 'react';
import { createPortal } from 'react-dom';
import { useTransition } from '@react-spring/web';
import { SPRING_RESPONSIVE } from './spring.js';
import { TooltipWrapper, TooltipPopover, TooltipArrow } from './long-press-tooltip.styles.js';

const DEFAULT_LONG_PRESS_MS = 450;
// Generous enough to absorb finger jitter on a "still" touch hold, small enough
// that a deliberate scroll still cancels the tooltip.
const MOVE_CANCEL_PX = 16;
const GAP_PX = 8;
const VIEWPORT_MARGIN_PX = 12;
const DEFAULT_AUTO_DISMISS_MS = 6000;

export interface LongPressTooltipProps {
	/** The row/control this tooltip describes — receives the long-press gesture. */
	children: ReactNode;
	/** Arbitrary content shown in the floating bubble (caller owns i18n/markup). */
	content: ReactNode;
	/** Hold duration before the bubble opens, in ms. */
	longPressMs?: number;
	/** How long the bubble stays up before auto-dismissing, in ms. */
	autoDismissMs?: number;
}

interface PopoverCoords {
	top: number;
	left: number;
	placement: 'above' | 'below';
	arrowLeft: number;
}

/**
 * Domain-free touch-and-hold tooltip. Reveals `content` in a floating bubble on
 * long-press; the bubble is portaled to <body> so it escapes any clipped
 * ancestor, and the completed hold swallows the trailing click so it never
 * triggers the row's tap action. Dismisses on outside tap / scroll / resize /
 * Escape / timeout.
 *
 * Language/character knowledge stays in the consuming app: pass an already-built
 * node (e.g. an AnimatedText) as `content`.
 */
export const LongPressTooltip = ({
	children,
	content,
	longPressMs = DEFAULT_LONG_PRESS_MS,
	autoDismissMs = DEFAULT_AUTO_DISMISS_MS,
}: LongPressTooltipProps): ReactElement => {
	const wrapperRef = useRef<HTMLDivElement>(null);
	const popoverRef = useRef<HTMLDivElement>(null);
	const timerRef = useRef<number | undefined>(undefined);
	const pressStartRef = useRef<{ x: number; y: number } | null>(null);
	// Set when the hold fires so the following click is swallowed (not a tap).
	const longPressFiredRef = useRef(false);

	const [open, setOpen] = useState(false);
	const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
	const [coords, setCoords] = useState<PopoverCoords | null>(null);

	const clearTimer = useCallback(() => {
		if (timerRef.current !== undefined) {
			clearTimeout(timerRef.current);
			timerRef.current = undefined;
		}
	}, []);

	const handlePointerDown = useCallback(
		(event: ReactPointerEvent<HTMLDivElement>) => {
			if (!event.isPrimary) return;
			if (event.pointerType === 'mouse' && event.button !== 0) return;
			pressStartRef.current = { x: event.clientX, y: event.clientY };
			clearTimer();
			timerRef.current = setTimeout(() => {
				const el = wrapperRef.current;
				if (!el) return;
				setAnchorRect(el.getBoundingClientRect());
				setCoords(null);
				setOpen(true);
				longPressFiredRef.current = true;
				// No explicit navigator.vibrate here: the OS runs its own long-press
				// haptic, and stacking ours on top read as a double buzz.
			}, longPressMs);
		},
		[clearTimer, longPressMs],
	);

	const handlePointerMove = useCallback(
		(event: ReactPointerEvent<HTMLDivElement>) => {
			const start = pressStartRef.current;
			if (!start) return;
			const dx = event.clientX - start.x;
			const dy = event.clientY - start.y;
			if (dx * dx + dy * dy > MOVE_CANCEL_PX * MOVE_CANCEL_PX) {
				clearTimer();
			}
		},
		[clearTimer],
	);

	const handlePressEnd = useCallback(() => {
		clearTimer();
		pressStartRef.current = null;
	}, [clearTimer]);

	const handleClickCapture = useCallback((event: ReactMouseEvent<HTMLDivElement>) => {
		// A completed long-press leaves a trailing click — swallow it so the row
		// action (toggle / picker) doesn't fire from a hold.
		if (longPressFiredRef.current) {
			event.preventDefault();
			event.stopPropagation();
			longPressFiredRef.current = false;
		}
	}, []);

	const handleContextMenu = useCallback((event: ReactMouseEvent<HTMLDivElement>) => {
		// Suppress the native long-press callout / right-click menu over the row.
		event.preventDefault();
	}, []);

	// Position the bubble once it has mounted and can be measured. Runs before
	// paint, so the entrance animation starts already in the right place.
	useLayoutEffect(() => {
		if (!open || !anchorRect || !popoverRef.current) return;
		const pop = popoverRef.current.getBoundingClientRect();
		const vw = window.innerWidth;
		const vh = window.innerHeight;

		const fitsBelow = anchorRect.bottom + GAP_PX + pop.height + VIEWPORT_MARGIN_PX <= vh;
		const placement: 'above' | 'below' = fitsBelow ? 'below' : 'above';
		const top = fitsBelow
			? anchorRect.bottom + GAP_PX
			: anchorRect.top - GAP_PX - pop.height;

		const left = Math.min(
			Math.max(anchorRect.left, VIEWPORT_MARGIN_PX),
			Math.max(vw - pop.width - VIEWPORT_MARGIN_PX, VIEWPORT_MARGIN_PX),
		);
		const arrowLeft = Math.min(
			Math.max(anchorRect.left + anchorRect.width / 2 - left - 5, 12),
			Math.max(pop.width - 22, 12),
		);

		setCoords({ top, left, placement, arrowLeft });
	}, [open, anchorRect]);

	// While open, any tap / scroll / resize / Escape dismisses the bubble. The
	// press that opened it already fired before this listener attached, so it
	// won't self-close.
	useEffect(() => {
		if (!open) return;
		const close = () => setOpen(false);
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') close();
		};
		const auto = setTimeout(close, autoDismissMs);
		document.addEventListener('pointerdown', close, true);
		window.addEventListener('scroll', close, true);
		window.addEventListener('resize', close);
		window.addEventListener('keydown', onKeyDown);
		return () => {
			clearTimeout(auto);
			document.removeEventListener('pointerdown', close, true);
			window.removeEventListener('scroll', close, true);
			window.removeEventListener('resize', close);
			window.removeEventListener('keydown', onKeyDown);
		};
	}, [open, autoDismissMs]);

	useEffect(() => clearTimer, [clearTimer]);

	const transitions = useTransition(open, {
		from: { opacity: 0, scale: 0.92 },
		enter: { opacity: 1, scale: 1 },
		leave: { opacity: 0, scale: 0.92 },
		config: SPRING_RESPONSIVE,
	});

	return (
		<TooltipWrapper
			ref={wrapperRef}
			onPointerDown={handlePointerDown}
			onPointerMove={handlePointerMove}
			onPointerUp={handlePressEnd}
			onPointerLeave={handlePressEnd}
			onPointerCancel={handlePressEnd}
			onClickCapture={handleClickCapture}
			onContextMenu={handleContextMenu}
		>
			{children}
			{createPortal(
				transitions((style, isOpen) =>
					isOpen && anchorRect ? (
						<TooltipPopover
							ref={popoverRef}
							role="tooltip"
							style={{
								top: coords?.top ?? anchorRect.bottom + GAP_PX,
								left: coords?.left ?? anchorRect.left,
								opacity: style.opacity,
								transform: style.scale.to((s) => `scale(${s})`),
								transformOrigin: coords?.placement === 'above' ? 'bottom left' : 'top left',
							}}
						>
							{coords && (
								<TooltipArrow
									$placement={coords.placement}
									style={{ ['--arrow-left' as string]: `${coords.arrowLeft}px` }}
								/>
							)}
							{content}
						</TooltipPopover>
					) : null,
				),
				document.body,
			)}
		</TooltipWrapper>
	);
};

export default LongPressTooltip;
