import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import styled, { ThemeProvider } from 'styled-components';
import { buildTheme } from './theme.js';

/**
 * Integration: prove buildTheme(...) output is consumable exactly as xunzi
 * consumes it — through styled-components' ThemeProvider, with a styled
 * component reading values off props.theme. This exercises the real
 * consumption path (DefaultTheme resolution at the component level), not an
 * isolated object assertion.
 */

const Swatch = styled.div`
	color: ${(props) => props.theme.colors.primary};
	background: ${(props) => props.theme.colors.background};
	padding: ${(props) => props.theme.spacing.appStandardPadding};
	border-radius: ${(props) => props.theme.styling.borderRadiusPixel}px;
`;

describe('theme integration with styled-components ThemeProvider', () => {
	it('resolves light-theme tokens through props.theme', () => {
		const light = buildTheme('light');
		render(
			<ThemeProvider theme={light}>
				<Swatch data-testid="swatch">hi</Swatch>
			</ThemeProvider>
		);

		const el = screen.getByTestId('swatch');
		const styles = getComputedStyle(el);
		// #2E7D8C -> rgb(46, 125, 140)
		expect(styles.color).toBe('rgb(46, 125, 140)');
		// #64B5F6 -> rgb(100, 181, 246)
		expect(styles.background).toContain('rgb(100, 181, 246)');
		expect(styles.padding).toBe('1rem');
		expect(styles.borderRadius).toBe('32px');
	});

	it('resolves dark-theme tokens distinctly through props.theme', () => {
		const dark = buildTheme('dark');
		render(
			<ThemeProvider theme={dark}>
				<Swatch data-testid="swatch-dark">hi</Swatch>
			</ThemeProvider>
		);

		const el = screen.getByTestId('swatch-dark');
		const styles = getComputedStyle(el);
		// dark primary #81c784 -> rgb(129, 199, 132)
		expect(styles.color).toBe('rgb(129, 199, 132)');
	});
});
