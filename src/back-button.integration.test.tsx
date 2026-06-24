import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import BackButton from './back-button.js';
import { buildTheme } from './theme.js';

/**
 * Integration: BackButton in a realistic composition — wrapped in a
 * styled-components ThemeProvider built from kang's buildTheme(), mirroring how
 * xunzi's banners render it. Proves it consumes the theme (icon color resolves
 * to the themed onSurface token) and still drives a real back navigation.
 */
describe('BackButton in a themed composition', () => {
	it('resolves icon color from the light theme onSurface token', () => {
		const light = buildTheme('light');
		render(
			<ThemeProvider theme={light}>
				<BackButton onClick={() => {}} />
			</ThemeProvider>
		);
		const btn = screen.getByRole('button');
		const expected = `rgb(${hexToRgbTriplet(light.colors.onSurface)})`;
		expect(getComputedStyle(btn).color).toBe(expected);
	});

	it('resolves a distinct icon color from the dark theme', () => {
		const dark = buildTheme('dark');
		render(
			<ThemeProvider theme={dark}>
				<BackButton onClick={() => {}} />
			</ThemeProvider>
		);
		const btn = screen.getByRole('button');
		const expected = `rgb(${hexToRgbTriplet(dark.colors.onSurface)})`;
		expect(getComputedStyle(btn).color).toBe(expected);
	});

	it('drives back navigation inside a themed banner-like wrapper', () => {
		const dark = buildTheme('dark');
		const goBack = vi.fn();
		render(
			<ThemeProvider theme={dark}>
				<header>
					<BackButton ariaLabel="Back to discover" onClick={goBack} />
					<h1>Search</h1>
				</header>
			</ThemeProvider>
		);
		fireEvent.click(screen.getByRole('button', { name: 'Back to discover' }));
		expect(goBack).toHaveBeenCalledTimes(1);
	});
});

/** #rrggbb -> "r, g, b" (jsdom serializes color as `rgb(r, g, b)`). */
function hexToRgbTriplet(hex: string): string {
	const h = hex.replace('#', '');
	const r = parseInt(h.substring(0, 2), 16);
	const g = parseInt(h.substring(2, 4), 16);
	const b = parseInt(h.substring(4, 6), 16);
	return `${r}, ${g}, ${b}`;
}
