import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { ListItem, UnorderedListItemContainer } from './list-item.js';
import { buildTheme } from './theme.js';
import type { DynamicLanguage } from './language.js';

/**
 * Integration: a realistic settings list — multiple ListItems inside an
 * UnorderedListItemContainer, all under a styled-components ThemeProvider built
 * from kang's buildTheme(), mirroring how xunzi's Profile / AuthSection render
 * them. Proves the rows consume the theme (text color resolves to the themed
 * onSurface token), the container is a real list, and clicks + toggles wire
 * through across items.
 */

const useSandhi: DynamicLanguage = {
	english: 'Tone Sandhi',
	traditional: '變調',
	simplified: '变调',
};

function hexToRgbTriplet(hex: string): string {
	const h = hex.replace('#', '');
	const r = parseInt(h.substring(0, 2), 16);
	const g = parseInt(h.substring(2, 4), 16);
	const b = parseInt(h.substring(4, 6), 16);
	return `${r}, ${g}, ${b}`;
}

describe('ListItem in a themed settings list', () => {
	it('renders the rows inside a list and resolves text color from the light theme', () => {
		const light = buildTheme('light');
		render(
			<ThemeProvider theme={light}>
				<UnorderedListItemContainer>
					<ListItem icon="sunny" text="Clear Data" />
					<ListItem
						icon="translate"
						textContent={useSandhi}
						animate={false}
						staticLanguage="english"
						actionIcon="switch"
						switchChecked={false}
					/>
				</UnorderedListItemContainer>
			</ThemeProvider>
		);

		expect(screen.getByRole('list')).toBeInTheDocument();
		const rows = screen.getAllByRole('listitem');
		expect(rows).toHaveLength(2);

		const label = within(rows[0]).getByText('Clear Data');
		const expected = `rgb(${hexToRgbTriplet(light.colors.onSurface)})`;
		expect(getComputedStyle(label).color).toBe(expected);
	});

	it('resolves a distinct text color from the dark theme', () => {
		const dark = buildTheme('dark');
		render(
			<ThemeProvider theme={dark}>
				<UnorderedListItemContainer>
					<ListItem icon="sunny" text="Force Refresh" />
				</UnorderedListItemContainer>
			</ThemeProvider>
		);
		const label = screen.getByText('Force Refresh');
		const expected = `rgb(${hexToRgbTriplet(dark.colors.onSurface)})`;
		expect(getComputedStyle(label).color).toBe(expected);
	});

	it('drives a settings interaction: a navigation row and a toggle row in one list', () => {
		const light = buildTheme('light');
		const onClear = vi.fn();
		const onToggleSandhi = vi.fn();
		render(
			<ThemeProvider theme={light}>
				<UnorderedListItemContainer>
					<ListItem icon="sunny" text="Clear Data" onClick={onClear} />
					<ListItem
						icon="translate"
						textContent={useSandhi}
						animate={false}
						staticLanguage="english"
						actionIcon="switch"
						switchChecked={false}
						onSwitchChange={onToggleSandhi}
					/>
				</UnorderedListItemContainer>
			</ThemeProvider>
		);

		const rows = screen.getAllByRole('listitem');
		fireEvent.click(within(rows[0]).getByText('Clear Data'));
		expect(onClear).toHaveBeenCalledTimes(1);

		fireEvent.click(screen.getByRole('checkbox'));
		expect(onToggleSandhi).toHaveBeenCalledWith(true);
		// Toggling the switch must NOT fire the navigation row's handler.
		expect(onClear).toHaveBeenCalledTimes(1);
	});
});
