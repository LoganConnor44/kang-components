/**
 * BottomSheet — a draggable bottom-sheet modal with gesture support.
 *
 * Ported faithfully from ymy-components (`./bottom-sheet/BottomSheet`). The public
 * API (`BottomSheetProps`) is preserved 1:1 so xunzi's single re-point site
 * (`src/views/bottom-sheet/BottomSheet.tsx`, imported as `LibraryBottomSheet`) is a
 * pure import swap.
 *
 * Behavior: an overlay + a panel that slides up from the bottom (`modal={false}`
 * drops the overlay, `aria-modal` and the Tab trap — see `BottomSheetProps.modal`;
 * `resizable` turns the handle into a resize grip — see `BottomSheetProps.resizable`).
 * The handle area is draggable (rubber-band physics dragging up, velocity- or distance-based
 * swipe-to-close dragging down). Clicking the overlay or swiping past the close
 * threshold calls `onClose`. The component owns a `shouldRender` flag so it can
 * play the slide-out animation before unmounting, and fires `onExitComplete` once
 * the close actually finishes (an interrupted close — reopened mid-animation —
 * does NOT unmount or fire the callback).
 *
 * ⚠️ onExitComplete / onClose stability (the historically fragile part):
 * ymy listed `onExitComplete` in the deps of the effect driving the open/close
 * spring, so a consumer passing a fresh inline callback every render re-ran that
 * effect on every parent re-render — snapping the sheet off-screen then back
 * (jitter), and, when several landed in a row, leaving it off-screen long enough
 * to look like it self-closed (xunzi worked around this by forcing a stable
 * `useCallback`). Kang removes that footgun: the latest `onExitComplete` and
 * `onClose` are stashed in refs and read from the spring's `onRest` / drag-release
 * handler, so a new callback identity NEVER re-kicks the open/close spring. The
 * open/close effect depends ONLY on `isOpen` (+ `maxHeight`/`api`), which are the
 * things that should actually drive it. See the regression test.
 *
 * Theming: surface / scrim / outline / radius / padding read off styled-components'
 * `props.theme` tokens (assembled by kang's `buildTheme`), with the same literal
 * fallbacks ymy shipped so it renders sensibly with or without a `ThemeProvider`.
 * `styled-components`, `@react-spring/web` and `@use-gesture/react` are optional
 * peer dependencies, used only by this module.
 */

import {
	type ReactElement,
	type ReactNode,
	type KeyboardEvent as ReactKeyboardEvent,
	useRef,
	useEffect,
	useCallback,
	useState,
	useId,
} from 'react';
import { useSpring, animated } from '@react-spring/web';
import { useDrag } from '@use-gesture/react';
// Named import (not the default) so styled-components resolves consistently
// across bundler and raw ESM/CJS environments — matches the other styled
// kang primitives (ripple.ts, toggle-switch.tsx).
import { styled } from 'styled-components';

export interface BottomSheetProps {
	/** Whether the sheet is open */
	isOpen: boolean;
	/** Callback when the sheet should close */
	onClose: () => void;
	/** Content to render inside the sheet */
	children: ReactNode;
	/** Accessible title for screen readers */
	title?: string;
	/**
	 * Max height of the sheet (default: 300). With `resizable` it is also the
	 * upper bound of a drag, and replaces the panel's `85dvh` cap.
	 */
	maxHeight?: number;
	/** Velocity threshold for swipe-to-close in px/ms (default: 0.4) */
	velocityThreshold?: number;
	/** Percentage of height drag required to close (default: 0.25) */
	closeThreshold?: number;
	/** Fires after the close animation finishes (use for cleanup like clearing content) */
	onExitComplete?: () => void;
	/**
	 * Whether the sheet is modal (default: true). `modal={false}` renders no
	 * overlay element at all — so the page behind stays visible, scrollable and
	 * tappable, and a tap behind does not close the sheet — omits `aria-modal`,
	 * and drops the Tab focus trap. It keeps `role="dialog"` + `aria-labelledby`,
	 * moving focus into the panel on open and back on close, Escape-to-close
	 * (with focus inside the panel), and the handle's drag-to-close.
	 */
	modal?: boolean;
	/**
	 * Whether dragging the handle resizes the sheet (default: false). Dragging up
	 * grows the panel and dragging down shrinks it, clamped to
	 * `[minHeight, maxHeight]`. Dragging down past `minHeight` takes the close
	 * path: it closes once the overshoot passes `minHeight × closeThreshold`, or
	 * on a downward flick faster than `velocityThreshold`, and springs back to
	 * `minHeight` otherwise. The panel's height is `height` (or, uncontrolled,
	 * its content height until the first drag); its body scrolls when the content
	 * is taller. Omitting it renders exactly what 0.9.12 did.
	 */
	resizable?: boolean;
	/** Controlled panel height in px (`resizable` only). Pair with `onHeightChange`. */
	height?: number;
	/** Lower bound of a resize drag in px (`resizable` only; default: 120) */
	minHeight?: number;
	/** Fires with the new clamped height in px while the handle is dragged (`resizable` only) */
	onHeightChange?: (px: number) => void;
}

type SheetTheme = {
	colors?: {
		scrim?: string;
		surfaceRgb?: string;
		outline?: string;
	};
	styling?: {
		borderRadiusPixel?: number;
	};
	spacing?: {
		appStandardPadding?: string;
	};
};

const colors = (theme: unknown): NonNullable<SheetTheme['colors']> =>
	(theme as SheetTheme)?.colors ?? {};
const styling = (theme: unknown): NonNullable<SheetTheme['styling']> =>
	(theme as SheetTheme)?.styling ?? {};
const spacing = (theme: unknown): NonNullable<SheetTheme['spacing']> =>
	(theme as SheetTheme)?.spacing ?? {};

const SheetOverlay = styled.div`
	position: absolute;
	inset: 0;
	background-color: ${({ theme }) => colors(theme).scrim ?? 'rgba(0, 0, 0, 0.4)'};
`;

const SheetContent = styled.div`
	background-color: rgb(${({ theme }) => colors(theme).surfaceRgb ?? '255, 255, 255'});
	border-top-left-radius: ${({ theme }) => styling(theme).borderRadiusPixel ?? 24}px;
	border-top-right-radius: ${({ theme }) => styling(theme).borderRadiusPixel ?? 24}px;
	max-height: 85dvh;
	padding-bottom: max(env(safe-area-inset-bottom), 16px);
`;

const SheetHandle = styled.div`
	width: 40px;
	height: 5px;
	background-color: ${({ theme }) => colors(theme).outline ?? 'rgba(0, 0, 0, 0.3)'};
	border-radius: 3px;
	margin: 12px auto 8px;
`;

const SheetBody = styled.div`
	padding: 0 ${({ theme }) => spacing(theme).appStandardPadding ?? '16px'};
`;

const VisuallyHidden = styled.span`
	position: absolute;
	width: 1px;
	height: 1px;
	padding: 0;
	margin: -1px;
	overflow: hidden;
	clip: rect(0, 0, 0, 0);
	white-space: nowrap;
	border: 0;
`;

// Rubber-band damping function (from Vaul)
function dampenValue(v: number): number {
	return 8 * (Math.log(v + 1) - 2);
}

const FOCUSABLE_SELECTOR =
	'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Focusable descendants of `root`, in DOM order (for the focus trap). */
function getFocusable(root: HTMLElement | null): HTMLElement[] {
	if (!root) return [];
	return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
}

/**
 * Draggable bottom sheet modal with gesture support.
 * Features rubber-band physics, velocity-based swipe detection, and smooth animations.
 */
export function BottomSheet({
	isOpen,
	onClose,
	children,
	title = 'Bottom Sheet',
	maxHeight = 300,
	velocityThreshold = 0.4,
	closeThreshold = 0.25,
	onExitComplete,
	modal = true,
	resizable = false,
	height,
	minHeight = 120,
	onHeightChange,
}: BottomSheetProps): ReactElement {
	const modalRef = useRef<HTMLDivElement>(null);
	const [shouldRender, setShouldRender] = useState(isOpen);
	// Mirror of shouldRender for the effect to read the latest value without
	// re-subscribing (adding shouldRender to the effect deps would re-run
	// open/close on every toggle and reintroduce the snap).
	const shouldRenderRef = useRef(shouldRender);
	shouldRenderRef.current = shouldRender;

	// Stash the latest callbacks in refs so the open/close spring effect never
	// depends on their identity. A consumer passing a fresh inline onExitComplete
	// (or onClose) every render must NOT re-kick the open/close spring — that was
	// the jitter / apparent-self-close bug. The effect reads .current at the
	// moment it actually needs the callback (on close-finished / on drag-release).
	const onExitCompleteRef = useRef(onExitComplete);
	onExitCompleteRef.current = onExitComplete;
	const onCloseRef = useRef(onClose);
	onCloseRef.current = onClose;
	const onHeightChangeRef = useRef(onHeightChange);
	onHeightChangeRef.current = onHeightChange;

	// Resizable: the height the panel renders at when the consumer doesn't
	// control it (undefined = its content height, i.e. today's layout), and the
	// height a drag started from. Neither feeds the open/close effect.
	const [ownHeight, setOwnHeight] = useState<number | undefined>(undefined);
	const panelHeight = height ?? ownHeight;
	const dragStartHeight = useRef(0);

	const [spring, api] = useSpring(() => ({
		y: maxHeight,
		opacity: 0,
		config: { tension: 300, friction: 30 },
	}));

	// Handle open/close. Deps are intentionally ONLY [isOpen, api, maxHeight]:
	// the callbacks are read from refs so their identity can't re-run this effect.
	useEffect(() => {
		if (isOpen) {
			const openDistance = modalRef.current?.offsetHeight || maxHeight;
			// Only hard-snap to the closed position when opening from fully
			// closed. When reopening mid-close (a sheet swap), reverse from the
			// current position instead of jumping to the bottom.
			if (!shouldRenderRef.current) {
				api.set({ y: openDistance, opacity: 0 });
			}
			setShouldRender(true);
			api.start({ y: 0, opacity: 1 });
		} else {
			const closeDistance = modalRef.current?.offsetHeight || maxHeight;
			api.start({
				y: closeDistance,
				opacity: 0,
				onRest: (result) => {
					// Only tear down when the close actually finished. An
					// interrupted close (reopened mid-animation) fires onRest
					// with finished:false and must NOT unmount the sheet.
					if (result?.finished) {
						setShouldRender(false);
						// An uncontrolled resizable sheet reopens at its content height.
						setOwnHeight(undefined);
						onExitCompleteRef.current?.();
					}
				},
			});
		}
	}, [isOpen, api, maxHeight]);

	const handleClose = useCallback(() => {
		onCloseRef.current();
	}, []);

	// Accessible name for the dialog, linked to the visually-hidden title.
	const titleId = useId();

	// Focus management (#720), deliberately separate from the open/close spring
	// effect so it can't perturb the onExitComplete stability contract above.
	// On open: remember what had focus, then move focus into the sheet. On close:
	// return focus to the invoking element.
	const previouslyFocused = useRef<HTMLElement | null>(null);
	useEffect(() => {
		if (isOpen) {
			previouslyFocused.current = document.activeElement as HTMLElement | null;
			// Panel mounts this render; focus it after paint. tabIndex=-1 makes it
			// programmatically focusable without being a Tab stop itself.
			const raf = requestAnimationFrame(() => modalRef.current?.focus());
			return () => cancelAnimationFrame(raf);
		}
		// Closing: restore focus to the trigger if it's still around.
		previouslyFocused.current?.focus?.();
	}, [isOpen]);

	// Escape-to-close + a Tab focus trap so keyboard/AT users can't tab out of the
	// modal sheet or get stuck behind it. A non-modal sheet keeps Escape but not
	// the trap: the page behind it is meant to be reachable.
	const handleKeyDown = useCallback(
		(e: ReactKeyboardEvent<HTMLDivElement>) => {
			if (e.key === 'Escape') {
				e.stopPropagation();
				handleClose();
				return;
			}
			if (!modal) return;
			if (e.key !== 'Tab') return;
			const focusable = getFocusable(modalRef.current);
			if (focusable.length === 0) {
				// Nothing focusable inside — keep focus on the panel.
				e.preventDefault();
				modalRef.current?.focus();
				return;
			}
			const first = focusable[0];
			const last = focusable[focusable.length - 1];
			const activeEl = document.activeElement;
			if (e.shiftKey && (activeEl === first || activeEl === modalRef.current)) {
				e.preventDefault();
				last.focus();
			} else if (!e.shiftKey && activeEl === last) {
				e.preventDefault();
				first.focus();
			}
		},
		[handleClose, modal]
	);

	// Resize drag (resizable only): movement is measured from where the drag
	// started (`from` is [0, 0] in this mode), so the requested height is the
	// start height minus the movement. Within bounds the panel resizes and stays
	// put; below minHeight it holds minHeight and slides down by the overshoot,
	// which is what the close decision reads.
	const handleResize = (first: boolean, active: boolean, my: number, vy: number, dy: number) => {
		if (first) {
			dragStartHeight.current = panelHeight ?? (modalRef.current?.offsetHeight || minHeight);
		}
		const requested = dragStartHeight.current - my;
		const next = Math.min(maxHeight, Math.max(minHeight, requested));
		const overshoot = Math.max(0, minHeight - requested);

		if (active) {
			if (next !== panelHeight) {
				if (height === undefined) setOwnHeight(next);
				onHeightChangeRef.current?.(next);
			}
			api.start({ y: overshoot, immediate: true });
			const progress = Math.min(overshoot / minHeight, 1);
			api.start({ opacity: 1 - progress * 0.5, immediate: true });
			return;
		}
		// Only a drag that went below minHeight can close: a fast resize within
		// bounds must not read as a swipe-to-close.
		const shouldClose =
			overshoot > 0 &&
			((vy > velocityThreshold && dy > 0) || overshoot > minHeight * closeThreshold);
		if (shouldClose) {
			handleClose();
		} else {
			api.start({ y: 0, opacity: 1 });
		}
	};

	// Drag handler
	const bind = useDrag(
		({ first, active, movement: [, my], velocity: [, vy], direction: [, dy], cancel }) => {
			if (resizable) {
				handleResize(first, active, my, vy, dy);
				return;
			}
			// Prevent dragging up beyond the top
			if (my < -10) {
				cancel();
				return;
			}

			const dragDistance = Math.max(0, my);

			if (active) {
				// Apply rubber-band effect when dragging up
				const dampened = my < 0 ? dampenValue(-my) * -0.5 : dragDistance;
				api.start({ y: dampened, immediate: true });
				// Fade overlay based on drag progress
				const progress = Math.min(dragDistance / maxHeight, 1);
				api.start({ opacity: 1 - progress * 0.5, immediate: true });
			} else {
				// Check if should close based on velocity or distance
				const shouldClose =
					(vy > velocityThreshold && dy > 0) ||
					dragDistance > maxHeight * closeThreshold;

				if (shouldClose) {
					handleClose();
				} else {
					api.start({ y: 0, opacity: 1 });
				}
			}
		},
		{
			from: () => (resizable ? [0, 0] : [0, spring.y.get()]),
			filterTaps: true,
			axis: 'y',
			pointer: { touch: true },
			preventDefault: true,
			eventOptions: { passive: false },
		}
	);

	if (!shouldRender) {
		return <></>;
	}

	// Resizable: a fixed-height flex column whose body scrolls, capped at
	// maxHeight instead of 85dvh. Not resizable: no inline styles at all, so the
	// panel renders exactly as before.
	const panelStyle = resizable
		? {
				display: 'flex',
				flexDirection: 'column' as const,
				// border-box: height and maxHeight include the safe-area bottom padding.
				boxSizing: 'border-box' as const,
				maxHeight: `${maxHeight}px`,
				height: panelHeight === undefined ? undefined : `${panelHeight}px`,
			}
		: undefined;
	const bodyStyle = resizable ? { flex: '1 1 auto', minHeight: 0, overflowY: 'auto' as const } : undefined;

	return (
		<>
			{/* Non-modal renders no overlay at all (not a transparent or
			    pointer-events:none one): an absent element can't intercept a tap
			    or a scroll on the page behind. */}
			{modal && (
				<animated.div
					style={{
						position: 'fixed',
						inset: 0,
						zIndex: 49,
						opacity: spring.opacity,
						pointerEvents: isOpen ? 'auto' : 'none',
					}}
					onClick={handleClose}
				>
					<SheetOverlay />
				</animated.div>
			)}
			<animated.div
				style={{
					position: 'fixed',
					bottom: 0,
					left: 0,
					right: 0,
					zIndex: 50,
					transform: spring.y.to((y: number) => `translateY(${y}px)`),
				}}
			>
				<SheetContent
					ref={modalRef}
					role="dialog"
					aria-modal={modal ? 'true' : undefined}
					aria-labelledby={titleId}
					tabIndex={-1}
					onKeyDown={handleKeyDown}
					style={panelStyle}
				>
					<VisuallyHidden id={titleId}>{title}</VisuallyHidden>
					<div
						{...bind()}
						style={{
							touchAction: 'none',
							cursor: 'grab',
							padding: '8px 0',
						}}
					>
						<SheetHandle />
					</div>
					<SheetBody style={bodyStyle}>{children}</SheetBody>
				</SheetContent>
			</animated.div>
		</>
	);
}

export default BottomSheet;
