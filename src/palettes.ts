/**
 * Per-mode color palettes for the theme system.
 *
 * Bold minimal color system:
 * - Light mode: refined teal primary, sky-blue background, warm white surfaces.
 * - Dark mode: soft green primary, near-black with green tint.
 *
 * Every design token is a ready-to-use value; the theme builder is a mechanical
 * mapping from a palette to the theme object. Ported from ymy-components.
 */

/** Per-mode color palette: every design token as a ready-to-use value */
export interface ModeColorPalette {
	// Primary
	primary: string;
	onPrimary: string;
	primaryContainer: string;
	onPrimaryContainer: string;
	primaryDark: string;
	primaryDarker: string;

	// Secondary
	secondary: string;
	onSecondary: string;
	secondaryContainer: string;
	onSecondaryContainer: string;
	secondaryLight: string;

	// Success
	success: string;
	onSuccess: string;
	successContainer: string;
	onSuccessContainer: string;
	successSurface: string;
	successDark: string;
	successMuted: string;

	// Error
	error: string;
	onError: string;
	errorMuted: string;

	// Surface
	surface: string;
	onSurface: string;
	surfaceVariant: string;
	onSurfaceVariant: string;
	surfaceContainer: string;
	surfaceContainerHigh: string;

	// Background
	background: string;
	onBackground: string;

	// Outline & Dividers
	outline: string;
	outlineVariant: string;

	// Shadows
	shadow: string;
	shadowLight: string;
	shadowLighter: string;
	shadowSubtle: string;
	shadowFaint: string;

	// Overlay
	scrim: string;
	scrimLight: string;
	ripple: string;

	// Interactive states (white variants)
	whiteHigh: string;
	whiteMedium: string;
	whiteLow: string;
	whiteHover: string;

	// Keyboard
	keyboardSurface: string;
	keyCharacter: string;
	keyCharacterText: string;
	keyDefault: string;
	keyDefaultText: string;
	keyWrong: string;
	keyWrongMuted: string;
	keyCorrect: string;
	keyCorrectMuted: string;
	keyAccentText: string;
	keyDisabled: string;
	keyDisabledText: string;

	// Toggle/Switch
	toggleTrackOn: string;
	toggleTrackOff: string;
	toggleThumbOn: string;
	toggleThumbOff: string;
	toggleHoverOn: string;
	toggleHoverOff: string;
	toggleFocusOn: string;
	toggleFocusOff: string;

	// 3D text shadows
	textShadowDark: string;
	textShadow1: string;
	textShadow2: string;
	textShadow3: string;

	// RGB decompositions for rgba() usage
	primaryRgb: string;
	backgroundRgb: string;
	surfaceRgb: string;
	primaryDarkerRgb: string;
}

export const lightPalette: ModeColorPalette = {
	// Primary — refined teal, calm and grounded
	primary: '#2E7D8C',
	onPrimary: '#ffffff',
	primaryContainer: '#B2EBF2',
	onPrimaryContainer: '#1A5C68',
	primaryDark: '#256A77',
	primaryDarker: '#1C5561',

	// Secondary — bold goldenrod yellow
	secondary: '#E8C840',
	onSecondary: '#1A1A1A',
	secondaryContainer: '#FFF8E0',
	onSecondaryContainer: '#1A1A1A',
	secondaryLight: '#E8C840',

	// Success
	success: '#4ade80',
	onSuccess: '#0D3B70',
	successContainer: '#bbf7d0',
	onSuccessContainer: '#166534',
	successSurface: '#f0fdf4',
	successDark: '#22c55e',
	successMuted: '#3d6b56',

	// Error
	error: '#BF4B3E',
	onError: '#ffffff',
	errorMuted: '#6b4a46',

	// Surface — warm white
	surface: '#ffffff',
	onSurface: '#1A1A1A',
	surfaceVariant: '#FFF9F2',
	onSurfaceVariant: '#5A5550',
	surfaceContainer: '#F8F6F4',
	surfaceContainerHigh: '#F0EEEC',

	// Background — bright sky blue splash
	background: '#64B5F6',
	onBackground: '#0A0A0A',

	// Outline & Dividers
	outline: '#9E9E9E',
	outlineVariant: '#D0D0D0',

	// Shadows
	shadow: 'rgba(0, 0, 0, 0.28)',
	shadowLight: 'rgba(0, 0, 0, 0.15)',
	shadowLighter: 'rgba(0, 0, 0, 0.10)',
	shadowSubtle: 'rgba(0, 0, 0, 0.08)',
	shadowFaint: 'rgba(0, 0, 0, 0.05)',

	// Overlay
	scrim: 'rgba(0, 0, 0, 0.4)',
	scrimLight: 'rgba(0, 0, 0, 0.3)',
	ripple: 'rgba(0, 0, 0, 0.1)',

	// Interactive states (white variants for dark backgrounds)
	whiteHigh: 'rgba(255, 255, 255, 0.9)',
	whiteMedium: 'rgba(255, 255, 255, 0.5)',
	whiteLow: 'rgba(255, 255, 255, 0.4)',
	whiteHover: 'rgba(255, 255, 255, 0.08)',

	// Keyboard chrome — neutral gray (doesn't compete with blue)
	keyboardSurface: '#D5D3D0',
	keyCharacter: '#ffffff',
	keyCharacterText: '#1A1A1A',
	keyDefault: '#B5B2AE',
	keyDefaultText: '#1A1A1A',
	keyWrong: '#B5B2AE',
	keyWrongMuted: '#B5B2AE',
	keyCorrect: '#2E7D8C',
	keyCorrectMuted: '#256A77',
	keyAccentText: '#ffffff',
	keyDisabled: '#6E6E6E',
	keyDisabledText: '#9E9E9E',

	// Toggle/Switch — teal
	toggleTrackOn: 'rgba(46, 125, 140, 0.5)',
	toggleTrackOff: 'rgba(0, 0, 0, 0.38)',
	toggleThumbOn: '#2E7D8C',
	toggleThumbOff: '#FAFAFA',
	toggleHoverOn: 'rgba(46, 125, 140, 0.08)',
	toggleHoverOff: 'rgba(0, 0, 0, 0.04)',
	toggleFocusOn: 'rgba(46, 125, 140, 0.12)',
	toggleFocusOff: 'rgba(0, 0, 0, 0.06)',

	// 3D text shadows
	textShadowDark: '#505050',
	textShadow1: '#E0E0E0',
	textShadow2: '#D0D0D0',
	textShadow3: '#B8B8B8',

	// RGB decompositions
	primaryRgb: '46, 125, 140',
	backgroundRgb: '100, 181, 246',
	surfaceRgb: '255, 255, 255',
	primaryDarkerRgb: '28, 85, 97',
};

export const darkPalette: ModeColorPalette = {
	// Primary — soft green for contrast on near-black
	primary: '#81c784',
	onPrimary: '#1a4f2e',
	primaryContainer: '#1b5e20',
	onPrimaryContainer: '#c8e6c9',
	primaryDark: '#4caf50',
	primaryDarker: '#2e7d32',

	// Secondary — lighter orange/gold accents
	secondary: '#E8C840',
	onSecondary: '#161616',
	secondaryContainer: '#2A3A2A',
	onSecondaryContainer: '#FFF5E0',
	secondaryLight: '#D4A520',

	// Success
	success: '#4ade80',
	onSuccess: '#166534',
	successContainer: '#243d2f',
	onSuccessContainer: '#bbf7d0',
	successSurface: '#1a3022',
	successDark: '#4ade80',
	successMuted: '#22c55e',

	// Error — #f28078 gives >=4.5:1 on surface (#282C28)
	error: '#f28078',
	onError: '#161616',
	errorMuted: '#8b5a55',

	// Surface — near-black with subtle green tint
	surface: '#282C28',
	onSurface: '#eeeeee',
	surfaceVariant: '#1C201C',
	onSurfaceVariant: '#d0d0d0',
	surfaceContainer: '#323632',
	surfaceContainerHigh: '#3C403C',

	// Background — near-black hero
	background: '#0E110E',
	onBackground: '#eeeeee',

	// Outline & Dividers — neutral-tinted for green surfaces
	outline: '#858885',
	outlineVariant: '#656865',

	// Shadows — subtler on dark backgrounds
	shadow: 'rgba(0, 0, 0, 0.4)',
	shadowLight: 'rgba(0, 0, 0, 0.25)',
	shadowLighter: 'rgba(0, 0, 0, 0.15)',
	shadowSubtle: 'rgba(0, 0, 0, 0.1)',
	shadowFaint: 'rgba(0, 0, 0, 0.06)',

	// Overlay
	scrim: 'rgba(0, 0, 0, 0.6)',
	scrimLight: 'rgba(0, 0, 0, 0.45)',
	ripple: 'rgba(255, 255, 255, 0.1)',

	// Interactive states (white variants)
	whiteHigh: 'rgba(255, 255, 255, 0.87)',
	whiteMedium: 'rgba(255, 255, 255, 0.5)',
	whiteLow: 'rgba(255, 255, 255, 0.2)',
	whiteHover: 'rgba(255, 255, 255, 0.08)',

	// Keyboard chrome — dark green-tinted
	keyboardSurface: '#1e241e',
	keyCharacter: '#383e38',
	keyCharacterText: '#eeeeee',
	keyDefault: '#2a302a',
	keyDefaultText: '#d0d0d0',
	keyWrong: '#2a302a',
	keyWrongMuted: '#2a302a',
	keyCorrect: '#4caf50',
	keyCorrectMuted: '#2e7d32',
	keyAccentText: '#eeeeee',
	keyDisabled: '#505050',
	keyDisabledText: '#6E6E6E',

	// Toggle/Switch — green teal
	toggleTrackOn: 'rgba(129, 199, 132, 0.5)',
	toggleTrackOff: 'rgba(255, 255, 255, 0.3)',
	toggleThumbOn: '#81c784',
	toggleThumbOff: '#6E6E6E',
	toggleHoverOn: 'rgba(129, 199, 132, 0.08)',
	toggleHoverOff: 'rgba(255, 255, 255, 0.04)',
	toggleFocusOn: 'rgba(129, 199, 132, 0.12)',
	toggleFocusOff: 'rgba(255, 255, 255, 0.06)',

	// 3D text shadows
	textShadowDark: '#000000',
	textShadow1: '#2A2A2A',
	textShadow2: '#161616',
	textShadow3: '#000000',

	// RGB decompositions
	primaryRgb: '129, 199, 132',
	backgroundRgb: '14, 17, 14',
	surfaceRgb: '40, 44, 40',
	primaryDarkerRgb: '46, 125, 50',
};
