import { describe, it, expect } from 'vitest';
import {
	tilePalette,
	tileColorIndex,
	tileColorForKey,
	type TileColor,
} from './tile-palette.js';

/**
 * Pins the word-tile palette + deterministic color picker that were previously
 * copy-pasted across six xunzi surfaces (Flashcard, WordSelectCard,
 * WordConfirmCard, ChallengeResultsCard, ChunkedBrowseGrid, HomeCard.helpers)
 * and partially in Confetti. Kang is now the single source of truth, so these
 * tests freeze the exact hex values and hashing behaviour every consumer
 * depends on — a change here is a deliberate, reviewed design change.
 */

describe('tilePalette', () => {
	it('is the eight airy pastels in stable order', () => {
		expect(tilePalette.map((c) => c.bg)).toEqual([
			'#90CAF9', // Soft blue
			'#A5D6A7', // Mint
			'#CE93D8', // Lavender
			'#FFAB91', // Peach
			'#80DEEA', // Light teal
			'#FFF59D', // Butter
			'#B39DDB', // Wisteria
			'#81D4FA', // Sky
		]);
	});

	it('uses near-black text on every tile for legibility', () => {
		for (const color of tilePalette) {
			expect(color.text).toBe('#1A1A1A');
		}
	});
});

describe('tileColorIndex', () => {
	it('is deterministic — same key always maps to the same index', () => {
		expect(tileColorIndex('你好')).toBe(tileColorIndex('你好'));
	});

	it('always returns an in-range index', () => {
		for (const key of ['', 'a', '学习', '中文字', 'lorem ipsum']) {
			const index = tileColorIndex(key);
			expect(index).toBeGreaterThanOrEqual(0);
			expect(index).toBeLessThan(tilePalette.length);
		}
	});

	it('matches the historical (hash + charCodeAt) * 31 algorithm', () => {
		// Reproduces the exact arithmetic the six xunzi copies used, so the
		// per-word color assignment is byte-identical post-extraction.
		const expected = (key: string): number => {
			let hash = 0;
			for (let i = 0; i < key.length; i++) {
				hash = (hash + key.charCodeAt(i)) * 31;
			}
			return Math.abs(hash) % tilePalette.length;
		};
		for (const key of ['你好', '学习', '中文', 'a', 'word']) {
			expect(tileColorIndex(key)).toBe(expected(key));
		}
	});
});

describe('tileColorForKey', () => {
	it('returns the palette entry at the deterministic index', () => {
		const color: TileColor = tileColorForKey('你好');
		expect(color).toBe(tilePalette[tileColorIndex('你好')]);
	});

	it('always returns a member of the palette', () => {
		for (const key of ['', 'x', '词语', 'hello world']) {
			expect(tilePalette).toContain(tileColorForKey(key));
		}
	});
});
