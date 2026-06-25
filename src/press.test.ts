import { describe, it, expect } from 'vitest';
import {
	BOUNCE_CURVE,
	PRESS_SCALE_PRIMARY,
	PRESS_SCALE_SUBTLE,
	pressPrimary,
	pressSubtle,
	pressPrimaryScale,
	pressSubtleScale,
} from './press.js';

/**
 * Pins press.ts (issue #21). press.ts is exercised indirectly in several
 * component suites but its constants and the literal shape of its CSS helpers
 * were never asserted directly. These tests are cheap regression insurance:
 * the constants are part of the public design language, and consumers
 * interpolate the helper output verbatim into their styling layer.
 */

// Collapse whitespace so assertions don't depend on indentation/newlines.
const squish = (css: string): string => css.replace(/\s+/g, ' ').trim();

describe('press constants', () => {
	it('pins the bounce curve', () => {
		expect(BOUNCE_CURVE).toBe('cubic-bezier(0.34, 1.56, 0.64, 1)');
	});

	it('pins the primary press scale (discrete action buttons)', () => {
		expect(PRESS_SCALE_PRIMARY).toBe(0.95);
	});

	it('pins the subtle press scale (large tappable surfaces)', () => {
		expect(PRESS_SCALE_SUBTLE).toBe(0.97);
	});

	it('keeps subtle less aggressive than primary', () => {
		expect(PRESS_SCALE_SUBTLE).toBeGreaterThan(PRESS_SCALE_PRIMARY);
	});
});

describe('transform-based helpers (pressPrimary / pressSubtle)', () => {
	it('pressPrimary returns the full transform press CSS', () => {
		const css = squish(pressPrimary());
		expect(css).toBe(squish(`
			transition: transform 0.3s ${BOUNCE_CURVE};
			will-change: transform;

			&:active {
				transform: scale(${PRESS_SCALE_PRIMARY});
				transition: transform 0.06s ease-out;
			}
		`));
	});

	it('pressSubtle uses the subtle scale, same structure', () => {
		const css = squish(pressSubtle());
		expect(css).toContain(`transform: scale(${PRESS_SCALE_SUBTLE})`);
		expect(css).toContain(`transition: transform 0.3s ${BOUNCE_CURVE}`);
		expect(css).toContain('transition: transform 0.06s ease-out');
		expect(css).toContain('will-change: transform');
	});

	it('animates transform (not the CSS scale property)', () => {
		const css = squish(pressSubtle());
		expect(css).toContain('transform: scale(');
		expect(css).not.toMatch(/(^|[^-])scale: /);
	});

	it('appends extraTransition to both rest and pressed transitions', () => {
		const css = squish(pressPrimary('background 0.2s ease'));
		expect(css).toContain(`transition: transform 0.3s ${BOUNCE_CURVE}, background 0.2s ease`);
		expect(css).toContain('transition: transform 0.06s ease-out, background 0.2s ease');
	});

	it('omits the extra transition when none is passed', () => {
		const css = squish(pressPrimary());
		// No comma-joined extra clause after the duration/easing (the bezier
		// curve itself contains commas, so check the closing `;` directly).
		expect(css).toContain(`transition: transform 0.3s ${BOUNCE_CURVE};`);
		expect(css).toContain('transition: transform 0.06s ease-out;');
		// No comma-joined extra clause appended to either transition.
		expect(css).not.toContain(`${BOUNCE_CURVE},`);
		expect(css).not.toContain('ease-out,');
	});
});

describe('scale-property helpers (pressPrimaryScale / pressSubtleScale)', () => {
	it('pressPrimaryScale animates the CSS scale property, not transform', () => {
		const css = squish(pressPrimaryScale());
		expect(css).toBe(squish(`
			transition: scale 0.3s ${BOUNCE_CURVE};

			&:active {
				scale: ${PRESS_SCALE_PRIMARY};
				transition: scale 0.06s ease-out;
			}
		`));
		expect(css).not.toContain('transform');
		expect(css).not.toContain('will-change');
	});

	it('pressSubtleScale uses the subtle scale', () => {
		const css = squish(pressSubtleScale());
		expect(css).toContain(`scale: ${PRESS_SCALE_SUBTLE}`);
		expect(css).toContain(`transition: scale 0.3s ${BOUNCE_CURVE}`);
		expect(css).toContain('transition: scale 0.06s ease-out');
	});

	it('appends extraTransition to both rest and pressed transitions', () => {
		const css = squish(pressSubtleScale('opacity 0.2s ease'));
		expect(css).toContain(`transition: scale 0.3s ${BOUNCE_CURVE}, opacity 0.2s ease`);
		expect(css).toContain('transition: scale 0.06s ease-out, opacity 0.2s ease');
	});
});
