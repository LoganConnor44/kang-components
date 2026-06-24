/**
 * Theme system — a mechanical mapping from a per-mode {@link ModeColorPalette}
 * to the theme object consumed via styled-components' `props.theme`.
 *
 * Ported from ymy-components. The palettes carry all color values; this builder
 * assembles them (plus spacing/styling tokens) into the shape the app reads.
 *
 * To wire global `DefaultTheme` typing in a consumer, augment styled-components
 * with {@link ThemeType} (see the project's `styled.d.ts`).
 */

import type { ModeColorPalette } from './palettes.js';
import { lightPalette, darkPalette } from './palettes.js';

/** Convert a hex color (`#rrggbb`) to an `"r, g, b"` string for rgba() usage */
export function hexToRgb(hex: string): string {
	const h = hex.replace('#', '');
	const r = parseInt(h.substring(0, 2), 16);
	const g = parseInt(h.substring(2, 4), 16);
	const b = parseInt(h.substring(4, 6), 16);
	return `${r}, ${g}, ${b}`;
}

function assembleTheme(palette: ModeColorPalette) {
	return {
		spacing: {
			appStandardPadding: '1rem',
		},
		colors: {
			// Core tokens — 1:1 from palette
			primary: palette.primary,
			onPrimary: palette.onPrimary,
			primaryContainer: palette.primaryContainer,
			onPrimaryContainer: palette.onPrimaryContainer,
			primaryDark: palette.primaryDark,
			primaryDarker: palette.primaryDarker,

			secondary: palette.secondary,
			onSecondary: palette.onSecondary,
			secondaryContainer: palette.secondaryContainer,
			onSecondaryContainer: palette.onSecondaryContainer,
			secondaryLight: palette.secondaryLight,

			success: palette.success,
			onSuccess: palette.onSuccess,
			successContainer: palette.successContainer,
			onSuccessContainer: palette.onSuccessContainer,
			successSurface: palette.successSurface,
			successDark: palette.successDark,
			successMuted: palette.successMuted,

			error: palette.error,
			onError: palette.onError,
			errorMuted: palette.errorMuted,

			surface: palette.surface,
			onSurface: palette.onSurface,
			surfaceVariant: palette.surfaceVariant,
			onSurfaceVariant: palette.onSurfaceVariant,
			surfaceContainer: palette.surfaceContainer,
			surfaceContainerHigh: palette.surfaceContainerHigh,

			background: palette.background,
			onBackground: palette.onBackground,

			outline: palette.outline,
			outlineVariant: palette.outlineVariant,

			shadow: palette.shadow,
			shadowLight: palette.shadowLight,
			shadowLighter: palette.shadowLighter,
			shadowSubtle: palette.shadowSubtle,
			shadowFaint: palette.shadowFaint,

			scrim: palette.scrim,
			scrimLight: palette.scrimLight,
			ripple: palette.ripple,

			whiteHigh: palette.whiteHigh,
			whiteMedium: palette.whiteMedium,
			whiteLow: palette.whiteLow,
			whiteHover: palette.whiteHover,

			keyboardSurface: palette.keyboardSurface,
			keyCharacter: palette.keyCharacter,
			keyCharacterText: palette.keyCharacterText,
			keyDefault: palette.keyDefault,
			keyDefaultText: palette.keyDefaultText,
			keyWrong: palette.keyWrong,
			keyWrongMuted: palette.keyWrongMuted,
			keyCorrect: palette.keyCorrect,
			keyCorrectMuted: palette.keyCorrectMuted,
			keyAccentText: palette.keyAccentText,
			keyDisabled: palette.keyDisabled,
			keyDisabledText: palette.keyDisabledText,

			toggleTrackOn: palette.toggleTrackOn,
			toggleTrackOff: palette.toggleTrackOff,
			toggleThumbOn: palette.toggleThumbOn,
			toggleThumbOff: palette.toggleThumbOff,
			toggleHoverOn: palette.toggleHoverOn,
			toggleHoverOff: palette.toggleHoverOff,
			toggleFocusOn: palette.toggleFocusOn,
			toggleFocusOff: palette.toggleFocusOff,

			textShadowDark: palette.textShadowDark,
			textShadow1: palette.textShadow1,
			textShadow2: palette.textShadow2,
			textShadow3: palette.textShadow3,

			// RGB versions for rgba() usage in styled-components
			primaryRgb: palette.primaryRgb,
			backgroundRgb: palette.backgroundRgb,
			surfaceRgb: palette.surfaceRgb,
			primaryDarkerRgb: palette.primaryDarkerRgb,

			// Legacy mappings (for gradual migration - can be removed later)
			primaryLight: palette.primaryContainer,
			backgroundHex: palette.background,
			bottomNavBarBackgroundRgb: palette.primaryRgb,
			settingsBackgroundRgb: palette.surfaceRgb,
			text: palette.onSurface,
		},
		styling: {
			borderRadiusPixel: 32 as number,
		},
		palette,
	} as const;
}

/** Build a theme object for the given mode */
export function buildTheme(mode: 'light' | 'dark') {
	return assembleTheme(mode === 'dark' ? darkPalette : lightPalette);
}

/** Default light theme (for backwards compatibility and tests) */
export const theme = buildTheme('light');

/** Type export for use in styled.d.ts augmentations */
export type ThemeType = ReturnType<typeof buildTheme>;
