import { describe, it, expect } from 'vitest';
import { focusVisibleRing } from './focus-ring.js';

describe('focusVisibleRing (#719)', () => {
	it('emits a :focus-visible outline rule', () => {
		const out = focusVisibleRing().join('');
		expect(out).toContain(':focus-visible');
		expect(out).toContain('outline');
	});

	it('honors a custom outline-offset', () => {
		expect(focusVisibleRing('-3px').join('')).toContain('-3px');
	});
});
