import { describe, it, expect, vi } from 'vitest';
import { useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import ToggleSwitch from './toggle-switch.js';
import { buildTheme } from './theme.js';

/**
 * Integration: ToggleSwitch in its real consumption shape — wrapped in a
 * styled-components ThemeProvider fed by buildTheme(...), inside a clickable
 * settings row (the exact shape xunzi's Profile.tsx error-reporting row uses,
 * where the row itself is clickable and the switch must stop propagation).
 *
 * Asserts the track consumes the theme's toggle tokens (track-on differs from
 * track-off, and light differs from dark), the controlled value round-trips
 * through a parent's state, and a tap on the switch toggles it WITHOUT firing
 * the surrounding row's onClick.
 */

const getCheckbox = () => screen.getByRole('checkbox') as HTMLInputElement;

const getTrack = (): HTMLElement => {
	const label = screen.getByRole('checkbox').closest('label')!;
	// Track is the first span child (order: track, ripple, thumb).
	return label.querySelector('span') as HTMLElement;
};

function SettingsRow({ onRowClick }: { onRowClick: () => void }) {
	const [enabled, setEnabled] = useState(false);
	return (
		<div data-testid="row" onClick={onRowClick}>
			<span>Error reporting</span>
			<ToggleSwitch checked={enabled} onChange={setEnabled} />
		</div>
	);
}

describe('ToggleSwitch + ThemeProvider(buildTheme)', () => {
	it('consumes the light-theme toggle track tokens (on differs from off)', () => {
		const light = buildTheme('light');
		const { rerender } = render(
			<ThemeProvider theme={light}>
				<ToggleSwitch checked={false} />
			</ThemeProvider>
		);
		const offBg = getComputedStyle(getTrack()).backgroundColor;

		rerender(
			<ThemeProvider theme={light}>
				<ToggleSwitch checked={true} />
			</ThemeProvider>
		);
		const onBg = getComputedStyle(getTrack()).backgroundColor;

		expect(offBg).not.toBe('');
		expect(onBg).not.toBe('');
		expect(onBg).not.toBe(offBg);
	});

	it('renders distinct on-track colors for light vs dark themes', () => {
		const { rerender } = render(
			<ThemeProvider theme={buildTheme('light')}>
				<ToggleSwitch checked={true} />
			</ThemeProvider>
		);
		const lightOn = getComputedStyle(getTrack()).backgroundColor;

		rerender(
			<ThemeProvider theme={buildTheme('dark')}>
				<ToggleSwitch checked={true} />
			</ThemeProvider>
		);
		const darkOn = getComputedStyle(getTrack()).backgroundColor;

		expect(lightOn).not.toBe(darkOn);
	});

	it('toggles via a parent-controlled settings row without bubbling to the row', () => {
		const onRowClick = vi.fn();
		render(
			<ThemeProvider theme={buildTheme('light')}>
				<SettingsRow onRowClick={onRowClick} />
			</ThemeProvider>
		);

		const cb = getCheckbox();
		expect(cb.checked).toBe(false);

		// Click the checkbox (inside the label) — the label's onClick stops
		// propagation so the surrounding row's onClick must not fire, and the
		// parent-controlled state round-trips on.
		fireEvent.click(cb);
		expect(onRowClick).not.toHaveBeenCalled();
		expect(getCheckbox().checked).toBe(true);

		// Toggling again round-trips back off through the parent's state.
		fireEvent.click(getCheckbox());
		expect(getCheckbox().checked).toBe(false);
	});
});
