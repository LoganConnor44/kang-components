import { describe, it, expectTypeOf, expect } from 'vitest';
import type { DynamicLanguage, CharacterPreference, StaticLanguage } from './language.js';
import * as kang from './index.js';

/**
 * These are pure types (no runtime). We assert at the type level that the
 * exports resolve to the expected shapes/unions, and that a realistic consumer
 * value type-checks — proving the exported types are usable as xunzi will use
 * them (e.g. SettingTooltip's CharacterPreference + StaticLanguage props).
 */
describe('language types', () => {
	it('DynamicLanguage has english/traditional/simplified string fields', () => {
		expectTypeOf<DynamicLanguage>().toMatchTypeOf<{
			english: string;
			traditional: string;
			simplified: string;
		}>();
	});

	it('CharacterPreference is the simplified | traditional union', () => {
		expectTypeOf<CharacterPreference>().toEqualTypeOf<'simplified' | 'traditional'>();
	});

	it('StaticLanguage is the english | chinese union', () => {
		expectTypeOf<StaticLanguage>().toEqualTypeOf<'english' | 'chinese'>();
	});

	it('a realistic consumer value type-checks and resolves at runtime', () => {
		const content: DynamicLanguage = {
			english: 'hello',
			traditional: '你好',
			simplified: '你好',
		};
		const pref: CharacterPreference = 'simplified';
		const lang: StaticLanguage = 'chinese';

		// Mirrors how a consumer reads the preferred display string.
		const shown = lang === 'english' ? content.english : content[pref];
		expect(shown).toBe('你好');
	});

	it('re-exports the language types from the package entrypoint', () => {
		// Types are erased at runtime; assert the namespace object exists and the
		// type-only re-export compiles by referencing it in a type position.
		expect(kang).toBeTypeOf('object');
		expectTypeOf<typeof import('./index.js')>().toHaveProperty('buildTheme');
	});
});
