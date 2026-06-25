import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { useCallback, useState } from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { Globals } from '@react-spring/web';
import { BottomSheet } from './bottom-sheet.js';
import { buildTheme } from './theme.js';

/**
 * Integration: BottomSheet in its real consumption shape — wrapped in a
 * styled-components ThemeProvider fed by buildTheme(...), driven by a parent that
 * owns `isOpen` and clears its content in onExitComplete (the exact shape xunzi's
 * `views/bottom-sheet/BottomSheet.tsx` uses: open from Redux, clear content on
 * exit). Asserts the panel consumes theme tokens (surface/radius differ from the
 * bare fallback, light differs from dark), the open→close→exit lifecycle drives
 * the parent's state, and a swap of content while open does not tear the sheet
 * down.
 */

// Even in skipAnimation mode, react-spring resolves a spring's onRest on a
// microtask/timer, so the close-finished teardown lands after the render tick.
const flush = () => new Promise((r) => setTimeout(r, 20));

beforeAll(() => {
	Globals.assign({ skipAnimation: true });
});
afterAll(() => {
	Globals.assign({ skipAnimation: false });
});

// The sheet panel is the SheetContent div — it carries the themed border radius
// and background. It's the div that directly contains the VisuallyHidden title.
const getPanel = (titleText: string): HTMLElement => {
	const hidden = screen.getByText(titleText);
	return hidden.parentElement as HTMLElement;
};

function Host({
	theme = buildTheme('light'),
	initialOpen = true,
}: {
	theme?: ReturnType<typeof buildTheme>;
	initialOpen?: boolean;
}) {
	const [isOpen, setIsOpen] = useState(initialOpen);
	const [content, setContent] = useState('first');
	const [cleared, setCleared] = useState(false);

	// Real consumers use a stable useCallback; the component is resilient either
	// way, but this mirrors xunzi's actual code.
	const onExitComplete = useCallback(() => setCleared(true), []);

	return (
		<ThemeProvider theme={theme}>
			<button onClick={() => setIsOpen(true)}>open</button>
			<button onClick={() => setIsOpen(false)}>close</button>
			<button onClick={() => setContent((c) => (c === 'first' ? 'second' : 'first'))}>
				swap
			</button>
			{cleared && <span>cleared</span>}
			<BottomSheet
				isOpen={isOpen}
				onClose={() => setIsOpen(false)}
				onExitComplete={onExitComplete}
				title="Settings"
			>
				<p>content-{content}</p>
			</BottomSheet>
		</ThemeProvider>
	);
}

describe('BottomSheet + ThemeProvider(buildTheme)', () => {
	it('consumes the theme surface + radius tokens (not the bare fallback)', () => {
		render(<Host />);
		const panel = getPanel('Settings');
		const styles = getComputedStyle(panel);
		// Themed radius is 32px (buildTheme styling.borderRadiusPixel), not the
		// component's bare 24px fallback.
		expect(styles.borderTopLeftRadius).toBe('32px');
		expect(styles.backgroundColor).not.toBe('');
	});

	it('renders distinct panel backgrounds for light vs dark themes', () => {
		const { rerender } = render(<Host theme={buildTheme('light')} />);
		const lightBg = getComputedStyle(getPanel('Settings')).backgroundColor;

		rerender(<Host theme={buildTheme('dark')} />);
		const darkBg = getComputedStyle(getPanel('Settings')).backgroundColor;

		expect(lightBg).not.toBe('');
		expect(darkBg).not.toBe('');
		expect(lightBg).not.toBe(darkBg);
	});

	it('drives the parent open→close→exit lifecycle (clears content on exit)', async () => {
		render(<Host />);
		expect(screen.getByText('content-first')).toBeInTheDocument();
		expect(screen.queryByText('cleared')).not.toBeInTheDocument();

		await act(async () => {
			fireEvent.click(screen.getByText('close'));
		});
		await act(async () => {
			await flush();
		});

		// Close finished → sheet unmounts and the parent's onExitComplete cleared.
		expect(screen.queryByText('content-first')).not.toBeInTheDocument();
		expect(screen.getByText('cleared')).toBeInTheDocument();
	});

	it('swaps content while open without tearing the sheet down or firing exit', () => {
		render(<Host />);
		expect(screen.getByText('content-first')).toBeInTheDocument();

		fireEvent.click(screen.getByText('swap'));

		// Content swapped in place; sheet still mounted; no spurious exit/clear.
		expect(screen.getByText('content-second')).toBeInTheDocument();
		expect(screen.queryByText('cleared')).not.toBeInTheDocument();
	});

	it('reopens cleanly after a full close (per-open lifecycle is not stuck)', async () => {
		render(<Host />);
		await act(async () => {
			fireEvent.click(screen.getByText('close'));
		});
		await act(async () => {
			await flush();
		});
		expect(screen.queryByText('content-first')).not.toBeInTheDocument();

		await act(async () => {
			fireEvent.click(screen.getByText('open'));
		});
		await act(async () => {
			await flush();
		});
		// A fresh open re-mounts and shows content again (no stuck/blank sheet).
		expect(screen.getByText('content-first')).toBeInTheDocument();
	});
});
