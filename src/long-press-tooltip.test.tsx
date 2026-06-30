import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { LongPressTooltip } from './long-press-tooltip.js';
import { buildTheme } from './theme.js';

/**
 * LongPressTooltip owns the domain-free touch-and-hold tooltip mechanics:
 * long-press detection, trailing-click suppression, move-cancel, viewport-flip
 * positioning (portaled to <body> to escape clipped ancestors), and dismissal
 * on outside tap / scroll / resize / Escape / timeout. The bubble content is
 * arbitrary (`content` prop) — language/character knowledge stays in the
 * consuming app's adapter. These tests pin the gesture contract.
 */

// Keep the entrance animation synchronous so the bubble is queryable immediately.
vi.mock('@react-spring/web', () => ({
	useTransition: (item: unknown) => (
		renderFn: (
			style: { opacity: number; scale: { to: (fn: (v: number) => string) => string } },
			i: unknown,
		) => unknown,
	) => renderFn({ opacity: 1, scale: { to: (fn) => fn(1) } }, item),
	animated: { div: 'div' },
}));

const LONG_PRESS_MS = 450;

const renderRow = (onClick = vi.fn()) => {
	render(
		<ThemeProvider theme={buildTheme('light')}>
			<LongPressTooltip content={<span>Explains the setting</span>}>
				<button data-testid="row" onClick={onClick}>
					HSK Level
				</button>
			</LongPressTooltip>
		</ThemeProvider>,
	);
	return onClick;
};

describe('LongPressTooltip', () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		act(() => {
			vi.runOnlyPendingTimers();
		});
		vi.useRealTimers();
	});

	it('renders the wrapped row and no tooltip initially', () => {
		renderRow();
		expect(screen.getByTestId('row')).toBeInTheDocument();
		expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
	});

	it('reveals the content bubble on touch-and-hold', () => {
		renderRow();
		const wrapper = screen.getByTestId('row').parentElement as HTMLElement;

		fireEvent.pointerDown(wrapper, { isPrimary: true, clientX: 10, clientY: 10 });
		act(() => {
			vi.advanceTimersByTime(LONG_PRESS_MS);
		});

		const tooltip = screen.getByRole('tooltip');
		expect(tooltip).toBeInTheDocument();
		expect(tooltip).toHaveTextContent('Explains the setting');
	});

	it('does not open on a quick tap and lets the row action fire', () => {
		const onClick = renderRow();
		const wrapper = screen.getByTestId('row').parentElement as HTMLElement;

		fireEvent.pointerDown(wrapper, { isPrimary: true, clientX: 10, clientY: 10 });
		act(() => {
			vi.advanceTimersByTime(100);
		});
		fireEvent.pointerUp(wrapper);
		fireEvent.click(screen.getByTestId('row'));

		expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
		expect(onClick).toHaveBeenCalledTimes(1);
	});

	it('swallows the trailing click so a hold never triggers the row action', () => {
		const onClick = renderRow();
		const wrapper = screen.getByTestId('row').parentElement as HTMLElement;

		fireEvent.pointerDown(wrapper, { isPrimary: true, clientX: 10, clientY: 10 });
		act(() => {
			vi.advanceTimersByTime(LONG_PRESS_MS);
		});
		fireEvent.pointerUp(wrapper);
		fireEvent.click(screen.getByTestId('row'));

		expect(onClick).not.toHaveBeenCalled();
	});

	it('cancels the hold if the pointer moves (a scroll)', () => {
		renderRow();
		const wrapper = screen.getByTestId('row').parentElement as HTMLElement;

		fireEvent.pointerDown(wrapper, { isPrimary: true, clientX: 10, clientY: 10 });
		fireEvent.pointerMove(wrapper, { clientX: 10, clientY: 60 });
		act(() => {
			vi.advanceTimersByTime(LONG_PRESS_MS);
		});

		expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
	});

	it('dismisses on an outside tap', () => {
		renderRow();
		const wrapper = screen.getByTestId('row').parentElement as HTMLElement;

		fireEvent.pointerDown(wrapper, { isPrimary: true, clientX: 10, clientY: 10 });
		act(() => {
			vi.advanceTimersByTime(LONG_PRESS_MS);
		});
		expect(screen.getByRole('tooltip')).toBeInTheDocument();

		act(() => {
			fireEvent.pointerDown(document.body);
		});
		expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
	});

	it('honors a custom long-press threshold', () => {
		render(
			<ThemeProvider theme={buildTheme('light')}>
				<LongPressTooltip content={<span>hi</span>} longPressMs={1000}>
					<button data-testid="row">Row</button>
				</LongPressTooltip>
			</ThemeProvider>,
		);
		const wrapper = screen.getByTestId('row').parentElement as HTMLElement;
		fireEvent.pointerDown(wrapper, { isPrimary: true, clientX: 10, clientY: 10 });
		act(() => {
			vi.advanceTimersByTime(450);
		});
		// Default threshold passed but custom one (1000ms) has not.
		expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
		act(() => {
			vi.advanceTimersByTime(550);
		});
		expect(screen.getByRole('tooltip')).toBeInTheDocument();
	});
});
