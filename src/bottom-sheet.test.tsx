import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import { useState } from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { Globals, Controller } from '@react-spring/web';
import { BottomSheet } from './bottom-sheet.js';

/**
 * Unit coverage for the ported BottomSheet. ymy shipped this component largely
 * untested; this file is the real coverage for the behavior xunzi relies on:
 * render open/closed, content, title (a11y), the close callbacks (overlay click),
 * the open→close→unmount lifecycle, and — critically — the onExitComplete /
 * onClose STABILITY fix (a new callback identity must not re-kick the spring).
 *
 * react-spring is put into skipAnimation mode so springs resolve synchronously:
 * the close animation's onRest fires in the same tick, letting us assert the
 * unmount + onExitComplete deterministically without faking rAF.
 */

// Even in skipAnimation mode, react-spring resolves a spring's onRest on a
// microtask/timer, so the close-finished teardown lands after the render tick.
const flush = () => new Promise((r) => setTimeout(r, 20));

beforeAll(() => {
	Globals.assign({ skipAnimation: true });
});
afterAll(() => {
	Globals.assign({ skipAnimation: false });
});

// The draggable handle is the only div carrying cursor: grab; the sheet panel is
// its parent's parent. The overlay is the fixed, inset:0 div with the onClick.
const getOverlay = (): HTMLElement => {
	// The overlay is an animated.div with position:fixed; inset:0; zIndex:49.
	// Query by its inline style — it's the element wrapping SheetOverlay.
	const candidates = Array.from(document.querySelectorAll('div')).filter(
		(d) => d.style.zIndex === '49'
	);
	return candidates[0] as HTMLElement;
};

describe('BottomSheet', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('renders its children and the accessible title when open', () => {
		render(
			<BottomSheet isOpen onClose={() => {}} title="My Sheet">
				<p>sheet content</p>
			</BottomSheet>
		);
		expect(screen.getByText('sheet content')).toBeInTheDocument();
		expect(screen.getByText('My Sheet')).toBeInTheDocument();
	});

	it('renders nothing when closed from the start', () => {
		const { container } = render(
			<BottomSheet isOpen={false} onClose={() => {}}>
				<p>hidden content</p>
			</BottomSheet>
		);
		expect(screen.queryByText('hidden content')).not.toBeInTheDocument();
		expect(container).toBeEmptyDOMElement();
	});

	it('calls onClose when the overlay is clicked', () => {
		const onClose = vi.fn();
		render(
			<BottomSheet isOpen onClose={onClose}>
				<p>content</p>
			</BottomSheet>
		);
		fireEvent.click(getOverlay());
		expect(onClose).toHaveBeenCalledTimes(1);
	});

	it('plays the close animation then unmounts and fires onExitComplete', async () => {
		const onExitComplete = vi.fn();
		const { rerender } = render(
			<BottomSheet isOpen onClose={() => {}} onExitComplete={onExitComplete}>
				<p>lifecycle content</p>
			</BottomSheet>
		);
		expect(screen.getByText('lifecycle content')).toBeInTheDocument();

		// Close → with skipAnimation the spring resolves (finished:true), but its
		// onRest fires on a later frame tick, so flush in a SEPARATE act (the
		// spring frameloop needs a commit boundary) before asserting the teardown.
		await act(async () => {
			rerender(
				<BottomSheet isOpen={false} onClose={() => {}} onExitComplete={onExitComplete}>
					<p>lifecycle content</p>
				</BottomSheet>
			);
		});
		await act(async () => {
			await flush();
		});

		expect(screen.queryByText('lifecycle content')).not.toBeInTheDocument();
		expect(onExitComplete).toHaveBeenCalledTimes(1);
	});

	it('does not fire onExitComplete while it stays open', () => {
		const onExitComplete = vi.fn();
		const { rerender } = render(
			<BottomSheet isOpen onClose={() => {}} onExitComplete={onExitComplete}>
				<p>content</p>
			</BottomSheet>
		);
		// A re-render that keeps isOpen true must not trigger any exit.
		rerender(
			<BottomSheet isOpen onClose={() => {}} onExitComplete={onExitComplete}>
				<p>content</p>
			</BottomSheet>
		);
		expect(onExitComplete).not.toHaveBeenCalled();
		expect(screen.getByText('content')).toBeInTheDocument();
	});

	it('uses the default title when none is provided', () => {
		render(
			<BottomSheet isOpen onClose={() => {}}>
				<p>content</p>
			</BottomSheet>
		);
		expect(screen.getByText('Bottom Sheet')).toBeInTheDocument();
	});

	/**
	 * REGRESSION — onExitComplete stability fix (ymy v0.8.88 footgun, fixed in kang).
	 *
	 * In ymy, `onExitComplete` (and `onClose`) sat in the deps of the effect that
	 * drives the open/close spring. A consumer passing a fresh inline callback
	 * every render re-ran that effect on every parent re-render, which re-kicked
	 * the open/close spring — jitter, and apparent self-close (xunzi worked around
	 * it by forcing a stable useCallback). Kang stashes both callbacks in refs so
	 * the effect depends ONLY on [isOpen, api, maxHeight] and a new callback
	 * identity can NEVER re-run it.
	 *
	 * This test is DISCRIMINATING: it spies on the spring Controller's `start`
	 * (the actual spring-kick) and asserts that minting brand-new inline callbacks
	 * across a burst of re-renders adds ZERO additional kicks beyond the single
	 * initial open. (Verified to FAIL against the ymy deps `[..., onExitComplete]`,
	 * where each re-render adds a kick.) Also asserts no spurious self-close.
	 */
	it('does NOT re-kick the open/close spring when onExitComplete identity changes each render', () => {
		const startSpy = vi.spyOn(Controller.prototype, 'start');
		const exitCalls: number[] = [];
		try {
			function Harness() {
				const [, force] = useState(0);
				// New inline callbacks EVERY render — the exact footgun.
				return (
					<>
						<button onClick={() => force((n) => n + 1)}>rerender</button>
						<BottomSheet
							isOpen
							onClose={() => {}}
							onExitComplete={() => exitCalls.push(Date.now())}
						>
							<p>stable content</p>
						</BottomSheet>
					</>
				);
			}

			render(<Harness />);
			expect(screen.getByText('stable content')).toBeInTheDocument();
			const kicksAfterInitialOpen = startSpy.mock.calls.length;
			expect(kicksAfterInitialOpen).toBeGreaterThan(0); // sanity: it opened

			// Force a burst of re-renders, each minting new callback identities.
			const rerenderBtn = screen.getByText('rerender');
			for (let i = 0; i < 8; i++) {
				fireEvent.click(rerenderBtn);
			}

			// No new spring kicks beyond the initial open: the fresh callback
			// identities did NOT re-run the open/close effect.
			expect(startSpy.mock.calls.length).toBe(kicksAfterInitialOpen);
			// And it never thought it closed.
			expect(screen.getByText('stable content')).toBeInTheDocument();
			expect(exitCalls).toHaveLength(0);
		} finally {
			startSpy.mockRestore();
		}
	});

	/**
	 * REGRESSION — the LATEST onClose is used even though onClose is read from a
	 * ref (so a fresh identity never re-runs the spring effect). Proves the ref
	 * stashing doesn't accidentally pin a stale callback.
	 */
	it('invokes the latest onClose identity on overlay click', () => {
		const first = vi.fn();
		const second = vi.fn();
		const { rerender } = render(
			<BottomSheet isOpen onClose={first}>
				<p>content</p>
			</BottomSheet>
		);
		rerender(
			<BottomSheet isOpen onClose={second}>
				<p>content</p>
			</BottomSheet>
		);
		fireEvent.click(getOverlay());
		expect(first).not.toHaveBeenCalled();
		expect(second).toHaveBeenCalledTimes(1);
	});
});

describe('BottomSheet dialog semantics (#720)', () => {
	it('is a labelled modal dialog', () => {
		render(
			<BottomSheet isOpen onClose={() => {}} title="Settings">
				<button>ok</button>
			</BottomSheet>
		);
		const dialog = screen.getByRole('dialog');
		expect(dialog).toHaveAttribute('aria-modal', 'true');
		// Name comes from the visually-hidden title via aria-labelledby.
		expect(dialog).toHaveAccessibleName('Settings');
	});

	it('closes on Escape', () => {
		const onClose = vi.fn();
		render(
			<BottomSheet isOpen onClose={onClose} title="X">
				<button>ok</button>
			</BottomSheet>
		);
		fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
		expect(onClose).toHaveBeenCalledTimes(1);
	});

	it('moves focus into the sheet on open', async () => {
		render(
			<BottomSheet isOpen onClose={() => {}} title="X">
				<button>ok</button>
			</BottomSheet>
		);
		const dialog = screen.getByRole('dialog');
		await act(async () => {
			await flush();
		});
		expect(dialog).toHaveFocus();
	});

	it('traps Tab focus (wraps last→first and first→last)', () => {
		render(
			<BottomSheet isOpen onClose={() => {}} title="X">
				<button>A</button>
				<button>B</button>
			</BottomSheet>
		);
		const dialog = screen.getByRole('dialog');
		const [a, b] = screen.getAllByRole('button');

		b.focus();
		fireEvent.keyDown(dialog, { key: 'Tab' });
		expect(a).toHaveFocus();

		a.focus();
		fireEvent.keyDown(dialog, { key: 'Tab', shiftKey: true });
		expect(b).toHaveFocus();
	});
});

/**
 * Non-modal mode (#41). `modal={false}` renders no overlay element at all (so
 * nothing can intercept a tap or scroll behind the sheet), omits `aria-modal`,
 * and drops the Tab trap — but it is still a labelled dialog, Escape inside the
 * panel still closes it, and the handle's drag-to-close still works.
 */
describe('BottomSheet non-modal (#41)', () => {
	// The handle is the only element carrying `cursor: grab`. `pointer.touch`
	// makes use-gesture listen for touch events rather than pointer events.
	const dragHandle = (dy: number) => {
		const handle = Array.from(document.querySelectorAll<HTMLElement>('div')).find(
			(d) => d.style.cursor === 'grab'
		) as HTMLElement;
		const touch = (y: number) => [{ identifier: 1, clientX: 100, clientY: y, target: handle }];
		fireEvent.touchStart(handle, { touches: touch(100), changedTouches: touch(100), targetTouches: touch(100) });
		for (let step = 1; step <= 4; step++) {
			const y = 100 + (dy * step) / 4;
			fireEvent.touchMove(handle, { touches: touch(y), changedTouches: touch(y), targetTouches: touch(y) });
		}
		const end = 100 + dy;
		fireEvent.touchEnd(handle, { touches: [], changedTouches: touch(end), targetTouches: [] });
	};

	it('keeps aria-modal and the overlay by default', () => {
		render(
			<BottomSheet isOpen onClose={() => {}} title="Default">
				<button>ok</button>
			</BottomSheet>
		);
		expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
		expect(getOverlay()).toBeDefined();
	});

	it('renders no overlay and no aria-modal, and is still a dialog named by its title', () => {
		render(
			<BottomSheet isOpen onClose={() => {}} title="Check-in" modal={false}>
				<button>ok</button>
			</BottomSheet>
		);
		expect(getOverlay()).toBeUndefined();
		const dialog = screen.getByRole('dialog');
		expect(dialog).not.toHaveAttribute('aria-modal');
		expect(dialog).toHaveAccessibleName('Check-in');
	});

	it('does not trap Tab: focus on the last button is not wrapped to the first', () => {
		render(
			<BottomSheet isOpen onClose={() => {}} title="X" modal={false}>
				<button>A</button>
				<button>B</button>
			</BottomSheet>
		);
		const dialog = screen.getByRole('dialog');
		const [, b] = screen.getAllByRole('button');
		b.focus();
		// fireEvent returns false when the handler called preventDefault.
		const notPrevented = fireEvent.keyDown(dialog, { key: 'Tab' });
		expect(notPrevented).toBe(true);
		expect(b).toHaveFocus();
	});

	it('closes on Escape with focus inside the panel', () => {
		const onClose = vi.fn();
		render(
			<BottomSheet isOpen onClose={onClose} title="X" modal={false}>
				<button>ok</button>
			</BottomSheet>
		);
		screen.getByRole('button', { name: 'ok' }).focus();
		fireEvent.keyDown(screen.getByRole('button', { name: 'ok' }), { key: 'Escape' });
		expect(onClose).toHaveBeenCalledTimes(1);
	});

	// jsdom does no hit-testing, so this cannot show a click being swallowed by an
	// overlay (the no-overlay test above is what pins that); it pins that nothing
	// outside the panel — e.g. a document-level click-outside listener — closes it.
	it('does not close when something behind the sheet is clicked', () => {
		const onClose = vi.fn();
		render(
			<>
				<button>behind</button>
				<BottomSheet isOpen onClose={onClose} title="X" modal={false}>
					<button>ok</button>
				</BottomSheet>
			</>
		);
		fireEvent.click(screen.getByRole('button', { name: 'behind' }));
		expect(onClose).not.toHaveBeenCalled();
	});

	it('closes when the handle is dragged past the threshold', () => {
		const onClose = vi.fn();
		// Synthetic touch events land microseconds apart, so every drag reads as a
		// fast flick; lift the velocity threshold out of reach so only the
		// distance path decides and the short drag is a real control.
		render(
			<BottomSheet isOpen onClose={onClose} title="X" modal={false} velocityThreshold={1e9}>
				<button>ok</button>
			</BottomSheet>
		);
		// A short drag (under maxHeight 300 × closeThreshold 0.25 = 75px) springs back…
		dragHandle(20);
		expect(onClose).not.toHaveBeenCalled();
		// …and one past it closes.
		dragHandle(200);
		expect(onClose).toHaveBeenCalledTimes(1);
	});
});

/**
 * Resizable mode (#196, kuibu-web). `resizable` turns the handle into a resize
 * grip: a drag up grows the panel, a drag down shrinks it, both clamped to
 * [minHeight, maxHeight], and only a drag past minHeight can close. Without it
 * the handle is the plain swipe-to-close it always was.
 */
describe('BottomSheet resizable (#196)', () => {
	// Same synthetic touch drag as the non-modal suite (`pointer.touch`).
	// `filterTaps` gives use-gesture a 3px threshold that it subtracts from the
	// movement, so a drag of N px resizes by N - TAP.
	const TAP = 3;
	const dragHandle = (dy: number) => {
		const handle = Array.from(document.querySelectorAll<HTMLElement>('div')).find(
			(d) => d.style.cursor === 'grab'
		) as HTMLElement;
		const touch = (y: number) => [{ identifier: 1, clientX: 100, clientY: y, target: handle }];
		fireEvent.touchStart(handle, { touches: touch(300), changedTouches: touch(300), targetTouches: touch(300) });
		for (let step = 1; step <= 4; step++) {
			const y = 300 + (dy * step) / 4;
			fireEvent.touchMove(handle, { touches: touch(y), changedTouches: touch(y), targetTouches: touch(y) });
		}
		const end = 300 + dy;
		fireEvent.touchEnd(handle, { touches: [], changedTouches: touch(end), targetTouches: [] });
	};

	// A consumer that owns the height, as kuibu-web's CheckInSheet does.
	function Controlled({
		onClose = () => {},
		onHeightChange,
		start = 400,
	}: {
		onClose?: () => void;
		onHeightChange?: (px: number) => void;
		start?: number;
	}) {
		const [h, setH] = useState(start);
		return (
			<BottomSheet
				isOpen
				onClose={onClose}
				title="Resizable"
				resizable
				height={h}
				minHeight={200}
				maxHeight={600}
				velocityThreshold={1e9}
				onHeightChange={(px) => {
					setH(px);
					onHeightChange?.(px);
				}}
			>
				<p>content</p>
			</BottomSheet>
		);
	}

	it('renders without inline panel styles when not resizable (unchanged default)', () => {
		render(
			<BottomSheet isOpen onClose={() => {}} title="Default">
				<p>content</p>
			</BottomSheet>
		);
		expect(screen.getByRole('dialog').getAttribute('style')).toBeNull();
	});

	it('sizes the panel from `height` and caps it at maxHeight instead of 85dvh', () => {
		render(<Controlled />);
		const dialog = screen.getByRole('dialog');
		expect(dialog.style.height).toBe('400px');
		expect(dialog.style.maxHeight).toBe('600px');
	});

	it('grows on a drag up, clamped to maxHeight', () => {
		const onHeightChange = vi.fn();
		render(<Controlled onHeightChange={onHeightChange} />);
		dragHandle(-100);
		expect(screen.getByRole('dialog').style.height).toBe(`${500 - TAP}px`);
		dragHandle(-500);
		expect(onHeightChange).toHaveBeenLastCalledWith(600);
		expect(screen.getByRole('dialog').style.height).toBe('600px');
	});

	it('shrinks on a drag down within bounds without closing', () => {
		const onClose = vi.fn();
		const onHeightChange = vi.fn();
		render(<Controlled onClose={onClose} onHeightChange={onHeightChange} />);
		dragHandle(150);
		expect(onHeightChange).toHaveBeenLastCalledWith(250 + TAP);
		expect(screen.getByRole('dialog').style.height).toBe(`${250 + TAP}px`);
		expect(onClose).not.toHaveBeenCalled();
	});

	it('does not close on a fast drag that stays within bounds', () => {
		const onClose = vi.fn();
		// Synthetic touches read as a fast flick; the default velocity threshold
		// applies here, and a resize that never passes minHeight must not close.
		function Fast() {
			const [h, setH] = useState(400);
			return (
				<BottomSheet isOpen onClose={onClose} resizable height={h} minHeight={200} maxHeight={600} onHeightChange={setH}>
					<p>content</p>
				</BottomSheet>
			);
		}
		render(<Fast />);
		dragHandle(150);
		expect(onClose).not.toHaveBeenCalled();
	});

	it('holds minHeight on a short drag past it, and closes on one past the threshold', () => {
		const onClose = vi.fn();
		render(<Controlled onClose={onClose} />);
		// 400 → 200 is the bound; 20px more is under 200 × 0.25 = 50px of overshoot.
		dragHandle(220);
		expect(screen.getByRole('dialog').style.height).toBe('200px');
		expect(onClose).not.toHaveBeenCalled();
		// From 200, a 120px drag down overshoots by 120 > 50 and closes.
		dragHandle(120);
		expect(onClose).toHaveBeenCalledTimes(1);
	});

	it('resizes uncontrolled when no `height` is passed', () => {
		const onHeightChange = vi.fn();
		render(
			<BottomSheet isOpen onClose={() => {}} resizable minHeight={100} maxHeight={600} onHeightChange={onHeightChange}>
				<p>content</p>
			</BottomSheet>
		);
		// jsdom lays nothing out (offsetHeight 0), so the drag starts from minHeight.
		dragHandle(-150);
		expect(onHeightChange).toHaveBeenLastCalledWith(250 - TAP);
		expect(screen.getByRole('dialog').style.height).toBe(`${250 - TAP}px`);
	});
});
