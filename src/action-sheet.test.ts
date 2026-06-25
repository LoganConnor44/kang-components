import { describe, it, expect } from 'vitest';
import { actionSheetContainer, actionSheetList, actionSheetRow } from './action-sheet.js';

/**
 * Smoke coverage for the action-sheet style helpers (issue #22). Low value by
 * design — just asserts each exported helper exists and produces a non-empty
 * CSS string, closing the module-coverage matrix.
 */

describe('action-sheet style helpers', () => {
	it('actionSheetContainer returns a column-flex CSS string', () => {
		const css = actionSheetContainer();
		expect(typeof css).toBe('string');
		expect(css.trim().length).toBeGreaterThan(0);
		expect(css).toContain('flex-direction: column');
	});

	it('actionSheetList returns a non-empty CSS string', () => {
		const css = actionSheetList();
		expect(typeof css).toBe('string');
		expect(css).toContain('display: flex');
	});

	it('actionSheetRow returns a non-empty CSS string without an active color when omitted', () => {
		const css = actionSheetRow();
		expect(typeof css).toBe('string');
		expect(css.trim().length).toBeGreaterThan(0);
		expect(css).toContain('cursor: pointer');
		expect(css).not.toContain('background-color: ');
	});

	it('actionSheetRow tints the pressed state when an activeBackground is passed', () => {
		const css = actionSheetRow('#123456');
		expect(css).toContain('&:active');
		expect(css).toContain('background-color: #123456');
	});
});
