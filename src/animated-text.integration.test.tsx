import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import { useState } from 'react';
import { render, act, fireEvent, screen, cleanup } from '@testing-library/react';
import { Globals } from '@react-spring/web';
import AnimatedText from './animated-text.js';

/**
 * Integration: AnimatedText in a realistic consumer composition. AnimatedText is
 * domain-free — the app's i18n layer maps its own language model down to
 * `variants` + `staticIndex`. This mirrors that: a parent owns a "languages"
 * preference and decides whether to cycle (multiple languages) or hold one
 * (single language → static), and chooses a wider `sizers` set so the box is
 * sized for ALL languages even while only some are cycled. It proves the
 * primitive cooperates with that consumer-driven control flow end to end.
 */

beforeAll(() => {
	Globals.assign({ skipAnimation: true });
});
afterAll(() => {
	Globals.assign({ skipAnimation: false });
});
beforeEach(() => {
	vi.useFakeTimers();
	vi.spyOn(Math, 'random').mockReturnValue(0); // steady delay === MIN_DELAY (3500)
});
afterEach(async () => {
	cleanup();
	vi.runOnlyPendingTimers();
	vi.useRealTimers();
	await act(async () => {
		await new Promise((r) => setTimeout(r, 0));
	});
	vi.restoreAllMocks();
});

const visibleText = (c: HTMLElement): string | null | undefined =>
	(
		Array.from(c.querySelectorAll('span')).find(
			(s) => s.getAttribute('aria-hidden') !== 'true'
		) as HTMLElement | undefined
	)?.textContent;
const sizerTexts = (c: HTMLElement): (string | null)[] =>
	Array.from(c.querySelectorAll('span[aria-hidden="true"]')).map((s) => s.textContent);

const ALL_LANGUAGES = ['Hello', '你好', 'こんにちは', 'Bonjour'];

/** A consumer that maps a language preference down to AnimatedText props. */
function Greeting() {
	const [selected, setSelected] = useState<string[]>(ALL_LANGUAGES);
	return (
		<div>
			<button onClick={() => setSelected([ALL_LANGUAGES[0]])}>only english</button>
			<button onClick={() => setSelected(ALL_LANGUAGES)}>all languages</button>
			<AnimatedText
				variants={selected}
				animate={selected.length > 1}
				// Always size for EVERY language so the box never reflows when the
				// cycled subset changes — the canonical reason to pass `sizers`.
				sizers={ALL_LANGUAGES}
			/>
		</div>
	);
}

describe('AnimatedText in an i18n-style consumer', () => {
	it('cycles through the consumer-selected languages while sized for all of them', async () => {
		const { container } = render(<Greeting />);

		// Starts on the first selected language; the box is sized for ALL languages.
		expect(visibleText(container)).toBe('Hello');
		expect(sizerTexts(container)).toEqual(ALL_LANGUAGES);

		await act(async () => {
			await vi.advanceTimersByTimeAsync(3550);
		});
		expect(visibleText(container)).toBe('你好');
	});

	it('switches to the static branch when the consumer narrows to one language', async () => {
		const { container } = render(<Greeting />);
		expect(visibleText(container)).toBe('Hello');

		// Narrow to a single language → animate flips false → static hold, no cycling.
		await act(async () => {
			fireEvent.click(screen.getByText('only english'));
		});
		expect(visibleText(container)).toBe('Hello');
		// No timer is armed in the static branch.
		expect(vi.getTimerCount()).toBe(0);

		// Even after a long wait, the static text never changes.
		await act(async () => {
			await vi.advanceTimersByTimeAsync(10000);
		});
		expect(visibleText(container)).toBe('Hello');
		// The sizer set still reserves room for all languages.
		expect(sizerTexts(container)).toEqual(ALL_LANGUAGES);
	});

	it('re-activates on the fast FIRST_CYCLE_DELAY when the consumer re-enables cycling', async () => {
		const { container } = render(<Greeting />);

		// Go static, then re-enable cycling: this is the false→true activation path,
		// which uses FIRST_CYCLE_DELAY (500ms) rather than the steady 3500ms.
		await act(async () => {
			fireEvent.click(screen.getByText('only english'));
		});
		await act(async () => {
			fireEvent.click(screen.getByText('all languages'));
		});
		expect(visibleText(container)).toBe('Hello');

		await act(async () => {
			await vi.advanceTimersByTimeAsync(550);
		});
		expect(visibleText(container)).toBe('你好');
	});
});
