import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { Confetti } from './confetti.js';

/**
 * Confetti is a dependency-free celebratory burst, portaled to <body> as a
 * viewport-fixed overlay. The burst is computed ONCE when it starts and frozen
 * for its lifetime — the freeze is a hard requirement (incidental re-renders,
 * e.g. from GunJS-synced props churning identity, must not re-roll pieces
 * mid-fall, which stalled/jumped them on iOS). These tests pin the piece count,
 * token sprinkling, inactive no-op, and the freeze guard.
 */

const layer = (): Element | null => document.querySelector('[aria-hidden="true"]');
const pieces = (): NodeListOf<Element> =>
	document.querySelectorAll('[aria-hidden="true"] > span');

afterEach(cleanup);

describe('Confetti', () => {
	it('renders nothing while inactive', () => {
		render(<Confetti active={false} />);
		expect(layer()).toBeNull();
	});

	it('portals a burst of `count` pieces to the document body when active', () => {
		render(<Confetti active count={12} />);
		const overlay = layer();
		expect(overlay).not.toBeNull();
		expect(overlay?.parentElement).toBe(document.body);
		expect(pieces()).toHaveLength(12);
	});

	it('sprinkles the provided text tokens among the pieces', () => {
		render(<Confetti active count={36} tokens={['你', '好']} />);
		const texts = Array.from(pieces()).map((p) => p.textContent);
		expect(texts.some((t) => t === '你' || t === '好')).toBe(true);
	});

	it('marks the overlay aria-hidden so it is ignored by assistive tech', () => {
		render(<Confetti active count={4} />);
		expect(layer()?.getAttribute('aria-hidden')).toBe('true');
	});

	it('freezes the burst — re-rendering with new tokens does not re-roll pieces', () => {
		const { rerender } = render(
			<Confetti active count={24} tokens={['A']} />,
		);
		const before = Array.from(pieces()).map((p) => p.textContent);
		// Same active/count/duration, only token identity changes (the GunJS churn
		// scenario). The in-flight burst must stay byte-identical.
		rerender(<Confetti active count={24} tokens={['Z']} />);
		const after = Array.from(pieces()).map((p) => p.textContent);
		expect(after).toEqual(before);
	});
});
