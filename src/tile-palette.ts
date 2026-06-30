/**
 * Word-tile palette — the airy pastel fills used behind tappable word tiles,
 * flashcards, browse-grid cells and celebratory confetti.
 *
 * These eight pastels are **mode-independent**: they read on both light and
 * dark surfaces and always pair with near-black text, so they live here as a
 * standalone constant rather than inside `ModeColorPalette` (which is per-mode).
 *
 * This is the single source of truth. It was previously copy-pasted across six
 * xunzi surfaces; consumers should import `tilePalette` / `tileColorForKey`
 * instead of redeclaring the hex values or the hashing logic. An app that needs
 * a different look should compose an explicit override, not fork the palette.
 */

/** A tile fill paired with the text color that stays legible on it. */
export interface TileColor {
	bg: string;
	text: string;
}

/** The eight airy pastels, in stable order (index is part of the contract). */
export const tilePalette: readonly TileColor[] = [
	{ bg: '#90CAF9', text: '#1A1A1A' }, // Soft blue
	{ bg: '#A5D6A7', text: '#1A1A1A' }, // Mint
	{ bg: '#CE93D8', text: '#1A1A1A' }, // Lavender
	{ bg: '#FFAB91', text: '#1A1A1A' }, // Peach
	{ bg: '#80DEEA', text: '#1A1A1A' }, // Light teal
	{ bg: '#FFF59D', text: '#1A1A1A' }, // Butter
	{ bg: '#B39DDB', text: '#1A1A1A' }, // Wisteria
	{ bg: '#81D4FA', text: '#1A1A1A' }, // Sky
];

/**
 * Deterministic index into {@link tilePalette} for an arbitrary key — the same
 * key always maps to the same color, so a given word keeps its tile color
 * everywhere it appears. Preserves the historical
 * `(hash + charCodeAt) * 31` algorithm the xunzi copies used.
 */
export function tileColorIndex(key: string): number {
	let hash = 0;
	for (let i = 0; i < key.length; i++) {
		hash = (hash + key.charCodeAt(i)) * 31;
	}
	return Math.abs(hash) % tilePalette.length;
}

/** Deterministic tile color for a key (see {@link tileColorIndex}). */
export function tileColorForKey(key: string): TileColor {
	return tilePalette[tileColorIndex(key)];
}
