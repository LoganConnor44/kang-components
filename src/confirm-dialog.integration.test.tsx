import { describe, it, expect, vi } from 'vitest';
import { useState, type ReactElement } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { ConfirmDialog } from './confirm-dialog.js';
import { buildTheme } from './theme.js';

/**
 * Integration: ConfirmDialog in its real consumption shape — wrapped in a
 * styled-components ThemeProvider fed by buildTheme(...), the exact path xunzi's
 * ClearDataConfirm / LogoutConfirm sheets use. Asserts the destructive button
 * consumes the theme's `error` token (not just the literal fallback), that it
 * differs across light/dark, and that confirm/cancel drive a realistic
 * consumer's close/clear logic.
 */

/** Convert a theme hex (`#rrggbb`) into the `rgb(r, g, b)` form getComputedStyle returns. */
function hexToRgbString(hex: string): string {
	const h = hex.replace('#', '');
	return `rgb(${parseInt(h.slice(0, 2), 16)}, ${parseInt(h.slice(2, 4), 16)}, ${parseInt(
		h.slice(4, 6),
		16
	)})`;
}

describe('ConfirmDialog + ThemeProvider(buildTheme)', () => {
	it('uses the theme error token for the destructive confirm color', () => {
		const light = buildTheme('light');
		render(
			<ThemeProvider theme={light}>
				<ConfirmDialog
					message="Clear all data?"
					confirmLabel="Clear"
					cancelLabel="Cancel"
					destructive
					onConfirm={() => {}}
					onCancel={() => {}}
				/>
			</ThemeProvider>
		);
		const confirm = screen.getByRole('button', { name: 'Clear' });
		expect(getComputedStyle(confirm).color).toBe(hexToRgbString(light.colors.error));
	});

	it('renders distinct destructive colors for light vs dark themes', () => {
		const { rerender } = render(
			<ThemeProvider theme={buildTheme('light')}>
				<ConfirmDialog
					message="Clear?"
					confirmLabel="Clear"
					cancelLabel="Cancel"
					destructive
					onConfirm={() => {}}
					onCancel={() => {}}
				/>
			</ThemeProvider>
		);
		const lightColor = getComputedStyle(screen.getByRole('button', { name: 'Clear' })).color;

		rerender(
			<ThemeProvider theme={buildTheme('dark')}>
				<ConfirmDialog
					message="Clear?"
					confirmLabel="Clear"
					cancelLabel="Cancel"
					destructive
					onConfirm={() => {}}
					onCancel={() => {}}
				/>
			</ThemeProvider>
		);
		const darkColor = getComputedStyle(screen.getByRole('button', { name: 'Clear' })).color;

		expect(lightColor).not.toBe(darkColor);
	});

	/**
	 * Mirror the xunzi sheet shape: a host that owns an `open` flag and a "data"
	 * value; confirm clears the data + closes, cancel just closes. Proves the
	 * callbacks are wired through a realistic interacting consumer under theme.
	 */
	function ClearDataLikeConsumer({
		onCleared,
	}: {
		onCleared: () => void;
	}): ReactElement | null {
		const [open, setOpen] = useState(true);
		if (!open) return null;
		return (
			<ConfirmDialog
				message="Clear all data?"
				description="This cannot be undone."
				confirmLabel="Clear all data"
				cancelLabel="Cancel"
				destructive
				onConfirm={() => {
					onCleared();
					setOpen(false);
				}}
				onCancel={() => setOpen(false)}
			/>
		);
	}

	it('drives a realistic consumer: confirm clears data and closes the sheet', () => {
		const onCleared = vi.fn();
		render(
			<ThemeProvider theme={buildTheme('light')}>
				<ClearDataLikeConsumer onCleared={onCleared} />
			</ThemeProvider>
		);
		expect(screen.getByText('Clear all data?')).toBeInTheDocument();
		fireEvent.click(screen.getByRole('button', { name: 'Clear all data' }));
		expect(onCleared).toHaveBeenCalledTimes(1);
		// Sheet closed → dialog unmounted.
		expect(screen.queryByText('Clear all data?')).not.toBeInTheDocument();
	});

	it('drives a realistic consumer: cancel closes the sheet without clearing', () => {
		const onCleared = vi.fn();
		render(
			<ThemeProvider theme={buildTheme('light')}>
				<ClearDataLikeConsumer onCleared={onCleared} />
			</ThemeProvider>
		);
		fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
		expect(onCleared).not.toHaveBeenCalled();
		expect(screen.queryByText('Clear all data?')).not.toBeInTheDocument();
	});

	it('renders the description under the theme provider', () => {
		render(
			<ThemeProvider theme={buildTheme('dark')}>
				<ConfirmDialog
					message="Sign out?"
					description="You will need to log back in."
					confirmLabel="Sign out"
					cancelLabel="Cancel"
					destructive
					onConfirm={() => {}}
					onCancel={() => {}}
				/>
			</ThemeProvider>
		);
		expect(screen.getByText('You will need to log back in.')).toBeInTheDocument();
	});
});
