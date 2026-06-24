import { describe, it, expect } from 'vitest';
import { buildTheme, theme, hexToRgb } from './theme.js';
import { lightPalette, darkPalette } from './palettes.js';
import type { ModeColorPalette } from './palettes.js';

/**
 * The full set of keys a ModeColorPalette must carry. Kept as a literal list so
 * the test fails loudly if a palette drops/gains a token (it can't read the
 * interface at runtime).
 */
const PALETTE_KEYS: (keyof ModeColorPalette)[] = [
	'primary', 'onPrimary', 'primaryContainer', 'onPrimaryContainer', 'primaryDark', 'primaryDarker',
	'secondary', 'onSecondary', 'secondaryContainer', 'onSecondaryContainer', 'secondaryLight',
	'success', 'onSuccess', 'successContainer', 'onSuccessContainer', 'successSurface', 'successDark', 'successMuted',
	'error', 'onError', 'errorMuted',
	'surface', 'onSurface', 'surfaceVariant', 'onSurfaceVariant', 'surfaceContainer', 'surfaceContainerHigh',
	'background', 'onBackground',
	'outline', 'outlineVariant',
	'shadow', 'shadowLight', 'shadowLighter', 'shadowSubtle', 'shadowFaint',
	'scrim', 'scrimLight', 'ripple',
	'whiteHigh', 'whiteMedium', 'whiteLow', 'whiteHover',
	'keyboardSurface', 'keyCharacter', 'keyCharacterText', 'keyDefault', 'keyDefaultText',
	'keyWrong', 'keyWrongMuted', 'keyCorrect', 'keyCorrectMuted', 'keyAccentText', 'keyDisabled', 'keyDisabledText',
	'toggleTrackOn', 'toggleTrackOff', 'toggleThumbOn', 'toggleThumbOff',
	'toggleHoverOn', 'toggleHoverOff', 'toggleFocusOn', 'toggleFocusOff',
	'textShadowDark', 'textShadow1', 'textShadow2', 'textShadow3',
	'primaryRgb', 'backgroundRgb', 'surfaceRgb', 'primaryDarkerRgb',
];

describe('hexToRgb', () => {
	it('converts a full 6-digit hex to an "r, g, b" string', () => {
		expect(hexToRgb('#2E7D8C')).toBe('46, 125, 140');
	});

	it('handles black and white extremes', () => {
		expect(hexToRgb('#000000')).toBe('0, 0, 0');
		expect(hexToRgb('#ffffff')).toBe('255, 255, 255');
	});

	it('tolerates a missing leading hash', () => {
		expect(hexToRgb('64B5F6')).toBe('100, 181, 246');
	});

	it('is case-insensitive', () => {
		expect(hexToRgb('#ABCDEF')).toBe(hexToRgb('#abcdef'));
	});

	it('matches the palette-provided primaryRgb decomposition', () => {
		// The palette ships a precomputed RGB string; hexToRgb must agree with it.
		expect(hexToRgb(lightPalette.primary)).toBe(lightPalette.primaryRgb);
		expect(hexToRgb(darkPalette.primary)).toBe(darkPalette.primaryRgb);
	});

	it('yields NaN segments for non-hex input (documents current behavior)', () => {
		// Edge case: the impl does no validation, so garbage parses to NaN.
		expect(hexToRgb('#zzzzzz')).toBe('NaN, NaN, NaN');
	});
});

describe('palette completeness', () => {
	it('light palette has every ModeColorPalette key with a non-empty string', () => {
		for (const key of PALETTE_KEYS) {
			expect(lightPalette[key], `lightPalette.${key}`).toBeTypeOf('string');
			expect(lightPalette[key].length, `lightPalette.${key} non-empty`).toBeGreaterThan(0);
		}
	});

	it('dark palette has every ModeColorPalette key with a non-empty string', () => {
		for (const key of PALETTE_KEYS) {
			expect(darkPalette[key], `darkPalette.${key}`).toBeTypeOf('string');
			expect(darkPalette[key].length, `darkPalette.${key} non-empty`).toBeGreaterThan(0);
		}
	});

	it('light and dark palettes expose identical key sets', () => {
		expect(Object.keys(lightPalette).sort()).toEqual(Object.keys(darkPalette).sort());
	});
});

describe('buildTheme', () => {
	it('maps the light palette into the theme for mode "light"', () => {
		const t = buildTheme('light');
		expect(t.palette).toBe(lightPalette);
		expect(t.colors.primary).toBe(lightPalette.primary);
		expect(t.colors.background).toBe(lightPalette.background);
		expect(t.colors.surface).toBe(lightPalette.surface);
	});

	it('maps the dark palette into the theme for mode "dark"', () => {
		const t = buildTheme('dark');
		expect(t.palette).toBe(darkPalette);
		expect(t.colors.primary).toBe(darkPalette.primary);
		expect(t.colors.background).toBe(darkPalette.background);
	});

	it('produces distinct primary colors between modes', () => {
		expect(buildTheme('light').colors.primary).not.toBe(buildTheme('dark').colors.primary);
	});

	it('exposes spacing and styling tokens', () => {
		const t = buildTheme('light');
		expect(t.spacing.appStandardPadding).toBe('1rem');
		expect(t.styling.borderRadiusPixel).toBe(32);
	});

	it('wires legacy migration aliases to the right palette values', () => {
		const t = buildTheme('dark');
		expect(t.colors.primaryLight).toBe(darkPalette.primaryContainer);
		expect(t.colors.backgroundHex).toBe(darkPalette.background);
		expect(t.colors.bottomNavBarBackgroundRgb).toBe(darkPalette.primaryRgb);
		expect(t.colors.settingsBackgroundRgb).toBe(darkPalette.surfaceRgb);
		expect(t.colors.text).toBe(darkPalette.onSurface);
	});

	it('exposes every palette color token on theme.colors', () => {
		const t = buildTheme('light');
		// Core tokens are mapped 1:1; verify each palette key resolves on colors.
		for (const key of PALETTE_KEYS) {
			expect(t.colors[key as keyof typeof t.colors], `colors.${key}`).toBe(lightPalette[key]);
		}
	});
});

describe('theme (default export value)', () => {
	it('is the light theme', () => {
		expect(theme.palette).toBe(lightPalette);
		expect(theme.colors.primary).toBe(lightPalette.primary);
	});

	it('has the expected top-level shape', () => {
		expect(theme).toHaveProperty('colors');
		expect(theme).toHaveProperty('spacing');
		expect(theme).toHaveProperty('styling');
		expect(theme).toHaveProperty('palette');
	});
});
