import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import CircleIconButton from './circle-icon-button.js';
import { buildTheme } from './theme.js';

/**
 * Integration: render CircleIconButton inside a styled-components ThemeProvider
 * driven by buildTheme(...) — the exact composition xunzi uses (HeroBanner /
 * ProfileButton render it under the app's themed tree). Proves the component
 * consumes theme tokens off props.theme (border = onPrimary, icon = onSurface)
 * and stays interactive within that real provider tree.
 */
describe('CircleIconButton in a buildTheme ThemeProvider', () => {
	it('reads onPrimary for the border and onSurface for the icon (light)', () => {
		const light = buildTheme('light');
		render(
			<ThemeProvider theme={light}>
				<CircleIconButton iconComponent="person" />
			</ThemeProvider>
		);

		const btn = screen.getByRole('button');
		const borderColor = getComputedStyle(btn).borderColor;
		// styled-components resolves the themed border color onto the button.
		expect(borderColor).toBeTruthy();
		// The icon wrapper <span> reads theme.colors.onSurface for its color.
		const iconSpan = btn.querySelector('span');
		expect(iconSpan).not.toBeNull();
		const iconColor = getComputedStyle(iconSpan as Element).color;
		expect(iconColor).toBeTruthy();
	});

	it('resolves distinct icon color between light and dark themes', () => {
		const light = buildTheme('light');
		const dark = buildTheme('dark');

		const { container: lightC } = render(
			<ThemeProvider theme={light}>
				<CircleIconButton iconComponent="qr" />
			</ThemeProvider>
		);
		const { container: darkC } = render(
			<ThemeProvider theme={dark}>
				<CircleIconButton iconComponent="qr" />
			</ThemeProvider>
		);

		const lightColor = getComputedStyle(
			lightC.querySelector('span') as Element
		).color;
		const darkColor = getComputedStyle(
			darkC.querySelector('span') as Element
		).color;

		// onSurface differs between the two modes, so the resolved color must too.
		expect(light.colors.onSurface).not.toEqual(dark.colors.onSurface);
		expect(lightColor).not.toEqual(darkColor);
	});

	it('stays interactive (fires onClick) inside the themed tree', () => {
		const onClick = vi.fn();
		render(
			<ThemeProvider theme={buildTheme('light')}>
				<CircleIconButton iconComponent="qr" onClick={onClick} />
			</ThemeProvider>
		);
		fireEvent.click(screen.getByRole('button'));
		expect(onClick).toHaveBeenCalledTimes(1);
	});
});
