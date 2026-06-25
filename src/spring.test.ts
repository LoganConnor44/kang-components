import { describe, it, expect } from 'vitest';
import * as spring from './spring.js';
import type { SpringConfigConstant } from './spring.js';

/**
 * Smoke coverage for the spring-config constants (issue #22). Each exported
 * config must be a plain `{ tension, friction, mass? }` object so it stays
 * structurally assignable to react-spring's `SpringConfig`. A couple of
 * representative values are pinned as a regression guard so the tuned feel
 * can't drift silently.
 */

const CONFIG_NAMES = [
	'SPRING_COMFORTABLE',
	'SPRING_COMFORTABLE_SLOW',
	'SPRING_SNAPPY',
	'SPRING_RESPONSIVE',
	'SPRING_STAGGERED',
	'SPRING_INSTANT',
	'SPRING_GENTLE',
	'SPRING_VERY_SLOW',
	'SPRING_LANDING',
	'SPRING_RISING',
] as const;

describe('spring configs', () => {
	it('exports every named config', () => {
		for (const name of CONFIG_NAMES) {
			expect(spring[name], name).toBeDefined();
		}
	});

	it.each(CONFIG_NAMES)('%s has numeric tension/friction (and numeric mass when present)', (name) => {
		const config = spring[name] as SpringConfigConstant;
		expect(typeof config.tension).toBe('number');
		expect(typeof config.friction).toBe('number');
		expect(Number.isFinite(config.tension)).toBe(true);
		expect(Number.isFinite(config.friction)).toBe(true);
		if (config.mass !== undefined) {
			expect(typeof config.mass).toBe('number');
			expect(Number.isFinite(config.mass)).toBe(true);
		}
	});

	it('pins representative values as a regression guard', () => {
		expect(spring.SPRING_COMFORTABLE).toEqual({ tension: 200, friction: 25 });
		expect(spring.SPRING_SNAPPY).toEqual({ tension: 325, friction: 30 });
		expect(spring.SPRING_LANDING).toEqual({ tension: 280, friction: 22, mass: 1 });
	});
});
