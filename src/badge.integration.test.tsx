import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { Badge } from './badge.js';
import { buildTheme } from './theme.js';

/**
 * Integration: Badge in its real consumption shape — wrapped in a
 * styled-components ThemeProvider fed by buildTheme(...), the exact path xunzi's
 * StreakBadge uses (a Badge nested in an animated.div under the app theme).
 * Asserts the badge consumes theme tokens (whiteLow / surfaceVariant /
 * successContainer backgrounds, primaryDarker / successDark text) rather than
 * only the literal fallbacks, and that those tokens differ across light/dark.
 */

/** Convert a theme hex (`#rrggbb`) into the `rgb(r, g, b)` form getComputedStyle returns. */
function hexToRgbString(hex: string): string {
	const h = hex.replace('#', '');
	return `rgb(${parseInt(h.slice(0, 2), 16)}, ${parseInt(h.slice(2, 4), 16)}, ${parseInt(
		h.slice(4, 6),
		16
	)})`;
}

describe('Badge + ThemeProvider(buildTheme)', () => {
	it('uses the theme whiteLow token for the primary background', () => {
		const light = buildTheme('light');
		render(
			<ThemeProvider theme={light}>
				<Badge value={7} label="streak" />
			</ThemeProvider>
		);
		const container = screen.getByText('7').parentElement as HTMLElement;
		// whiteLow is an rgba() token; it should appear in the background shorthand.
		expect(getComputedStyle(container).background).toContain(light.colors.whiteLow);
	});

	it('uses primaryDarker from the theme for the primary value color', () => {
		const light = buildTheme('light');
		render(
			<ThemeProvider theme={light}>
				<Badge value={7} />
			</ThemeProvider>
		);
		const value = screen.getByText('7');
		expect(getComputedStyle(value).color).toBe(hexToRgbString(light.colors.primaryDarker));
	});

	it('uses surfaceVariant for the muted variant background', () => {
		const light = buildTheme('light');
		render(
			<ThemeProvider theme={light}>
				<Badge value={3} variant="muted" />
			</ThemeProvider>
		);
		const container = screen.getByText('3').parentElement as HTMLElement;
		expect(getComputedStyle(container).background).toContain(
			hexToRgbString(light.colors.surfaceVariant)
		);
	});

	it('uses successContainer + successDark tokens for the success variant', () => {
		const light = buildTheme('light');
		render(
			<ThemeProvider theme={light}>
				<Badge value={5} variant="success" />
			</ThemeProvider>
		);
		const value = screen.getByText('5');
		const container = value.parentElement as HTMLElement;
		expect(getComputedStyle(container).background).toContain(
			hexToRgbString(light.colors.successContainer)
		);
		expect(getComputedStyle(value).color).toBe(hexToRgbString(light.colors.successDark));
	});

	it('uses the theme onSurface token for the label color', () => {
		const light = buildTheme('light');
		render(
			<ThemeProvider theme={light}>
				<Badge value={1} label="streak" />
			</ThemeProvider>
		);
		const label = screen.getByText('streak');
		expect(getComputedStyle(label).color).toBe(hexToRgbString(light.colors.onSurface));
	});

	it('renders distinct primary value colors for light vs dark themes', () => {
		const { rerender } = render(
			<ThemeProvider theme={buildTheme('light')}>
				<Badge value={9} />
			</ThemeProvider>
		);
		const lightColor = getComputedStyle(screen.getByText('9')).color;

		rerender(
			<ThemeProvider theme={buildTheme('dark')}>
				<Badge value={9} />
			</ThemeProvider>
		);
		const darkColor = getComputedStyle(screen.getByText('9')).color;

		expect(lightColor).not.toBe(darkColor);
	});

	it('renders the realistic StreakBadge composition without error', () => {
		// Mirror StreakBadge: a Badge under the app theme inside a wrapper div.
		render(
			<ThemeProvider theme={buildTheme('light')}>
				<div style={{ opacity: 1, transform: 'scale(1)' }}>
					<Badge value={12} label="streak" />
				</div>
			</ThemeProvider>
		);
		expect(screen.getByText('12')).toBeInTheDocument();
		expect(screen.getByText('streak')).toBeInTheDocument();
	});
});
