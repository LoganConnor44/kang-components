import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import BannerButton from './banner-button.js';
import { buildTheme } from './theme.js';

/**
 * Integration: BannerButton in its real consumption shape — wrapped in a
 * styled-components ThemeProvider fed by buildTheme(...), the exact path xunzi's
 * HeroBanner uses. Asserts the button consumes theme tokens (primary /
 * secondaryLight backgrounds, onPrimary text) rather than only the literal
 * fallbacks, and still behaves (click + label) inside the provider.
 */

const TEXT = { english: 'Daily', traditional: '每日', simplified: '每日' };

describe('BannerButton + ThemeProvider(buildTheme)', () => {
	it('consumes the light-theme primary tokens', () => {
		const light = buildTheme('light');
		render(
			<ThemeProvider theme={light}>
				<BannerButton buttonText={TEXT} iconComponent="send" animate={false} />
			</ThemeProvider>
		);

		const button = screen.getByRole('button');
		const styles = getComputedStyle(button);
		// primary #2E7D8C -> rgb(46, 125, 140); onPrimary should resolve too.
		expect(styles.backgroundColor).toBe('rgb(46, 125, 140)');
		expect(styles.color).not.toBe('');
	});

	it('uses the secondaryLight token for the secondary variant', () => {
		const light = buildTheme('light');
		render(
			<ThemeProvider theme={light}>
				<BannerButton buttonText={TEXT} buttonType="secondary" animate={false} />
			</ThemeProvider>
		);

		const styles = getComputedStyle(screen.getByRole('button'));
		const expected = `rgb(${[
			parseInt(light.colors.secondaryLight.slice(1, 3), 16),
			parseInt(light.colors.secondaryLight.slice(3, 5), 16),
			parseInt(light.colors.secondaryLight.slice(5, 7), 16),
		].join(', ')})`;
		expect(styles.backgroundColor).toBe(expected);
	});

	it('renders distinct primary backgrounds for light vs dark themes', () => {
		const { rerender } = render(
			<ThemeProvider theme={buildTheme('light')}>
				<BannerButton buttonText={TEXT} animate={false} />
			</ThemeProvider>
		);
		const lightBg = getComputedStyle(screen.getByRole('button')).backgroundColor;

		rerender(
			<ThemeProvider theme={buildTheme('dark')}>
				<BannerButton buttonText={TEXT} animate={false} />
			</ThemeProvider>
		);
		const darkBg = getComputedStyle(screen.getByRole('button')).backgroundColor;

		expect(lightBg).not.toBe(darkBg);
	});

	it('remains interactive inside the provider', () => {
		const onClick = vi.fn();
		render(
			<ThemeProvider theme={buildTheme('light')}>
				<BannerButton buttonText={TEXT} onClick={onClick} animate={false} />
			</ThemeProvider>
		);
		fireEvent.click(screen.getByRole('button'));
		expect(onClick).toHaveBeenCalledTimes(1);
		expect(screen.getAllByText('Daily').length).toBeGreaterThanOrEqual(1);
	});
});
