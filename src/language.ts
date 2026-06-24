/**
 * Shared language types — ported from ymy-components.
 *
 * These describe a multilingual content model and the user's display
 * preferences. They are pure types (no runtime), kept domain-light so consumers
 * (e.g. an i18n layer) can map their own language model onto primitives like
 * {@link AnimatedText}.
 *
 * In ymy these lived across `./types/DynamicLanguage` and
 * `./animations/AnimatedText`; kang's `AnimatedText` is intentionally
 * domain-free, so the language vocabulary is consolidated here.
 */

/** A single piece of content available in English, traditional, and simplified Chinese. */
export type DynamicLanguage = {
	english: string;
	traditional: string;
	simplified: string;
};

/** Which Chinese character set the user prefers to read. */
export type CharacterPreference = 'simplified' | 'traditional';

/** Which static (non-cycling) language to display. */
export type StaticLanguage = 'english' | 'chinese';
