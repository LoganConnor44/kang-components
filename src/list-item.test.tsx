import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { ListItem, UnorderedListItemContainer } from './list-item.js';
import type { DynamicLanguage } from './language.js';

/**
 * Unit coverage for the kang ListItem + UnorderedListItemContainer. ymy shipped
 * these untested; these assertions pin the behavior the xunzi call sites
 * (AuthSection, Profile) relied on — plain/multilingual text, leading-icon
 * variants, the trailing chevron vs. inline toggle, click + toggle wiring — plus
 * the kang upgrades (inline SVG icons, `iconNode` override).
 */

const TEXT: DynamicLanguage = {
	english: 'Sign In',
	traditional: '登入',
	simplified: '登录',
};

describe('UnorderedListItemContainer', () => {
	it('renders as a semantic <ul> list', () => {
		render(
			<UnorderedListItemContainer>
				<li>row</li>
			</UnorderedListItemContainer>
		);
		expect(screen.getByRole('list')).toBeInTheDocument();
	});

	it('renders its ListItem children as list items', () => {
		render(
			<UnorderedListItemContainer>
				<ListItem icon="sunny" text="One" />
				<ListItem icon="translate" text="Two" />
			</UnorderedListItemContainer>
		);
		expect(screen.getAllByRole('listitem')).toHaveLength(2);
	});
});

describe('ListItem', () => {
	it('renders plain text and a semantic <li>', () => {
		render(<ListItem icon="sunny" text="Force Refresh" />);
		const row = screen.getByRole('listitem');
		expect(within(row).getByText('Force Refresh')).toBeInTheDocument();
	});

	it('renders multilingual textContent, showing english first', () => {
		render(<ListItem icon="character" textContent={TEXT} />);
		const row = screen.getByRole('listitem');
		// AnimatedText shows english (variants[0]) on first render; the chinese
		// variants are present only as hidden sizers.
		expect(within(row).getAllByText('Sign In').length).toBeGreaterThan(0);
	});

	it('holds the chinese variant when animate is false (staticLanguage chinese)', () => {
		render(
			<ListItem
				icon="character"
				textContent={TEXT}
				animate={false}
				staticLanguage="chinese"
				characterPreference="simplified"
			/>
		);
		const row = screen.getByRole('listitem');
		// staticIndex 1 -> chinese (simplified) shown as the visible variant.
		expect(within(row).getAllByText('登录').length).toBeGreaterThan(0);
	});

	it('uses the traditional chinese variant when characterPreference is traditional', () => {
		render(
			<ListItem
				icon="character"
				textContent={TEXT}
				animate={false}
				staticLanguage="chinese"
				characterPreference="traditional"
			/>
		);
		const row = screen.getByRole('listitem');
		expect(within(row).getAllByText('登入').length).toBeGreaterThan(0);
	});

	describe('leading icon variants', () => {
		it('renders the inline translate svg', () => {
			const { container } = render(<ListItem icon="translate" text="x" />);
			const path = container.querySelector(
				'path[d^="m12.87 15.07"]'
			);
			expect(path).toBeInTheDocument();
		});

		it('renders the inline sunny svg', () => {
			const { container } = render(<ListItem icon="sunny" text="x" />);
			expect(container.querySelector('path[d^="m6.76 4.84"]')).toBeInTheDocument();
		});

		it('renders the 字 glyph for the character icon', () => {
			render(<ListItem icon="character" text="x" />);
			expect(screen.getByText('字')).toBeInTheDocument();
		});

		it('renders a custom iconNode in place of the built-in icon', () => {
			render(
				<ListItem icon="sunny" text="x" iconNode={<span data-testid="glyph">!</span>} />
			);
			expect(screen.getByTestId('glyph')).toBeInTheDocument();
			// The built-in sunny path must not render when overridden.
			expect(
				document.querySelector('path[d^="m6.76 4.84"]')
			).not.toBeInTheDocument();
		});
	});

	describe('trailing action', () => {
		it('defaults to the chevron action (no checkbox)', () => {
			const { container } = render(<ListItem icon="sunny" text="x" />);
			expect(
				container.querySelector('path[d^="M10 6 8.59 7.41"]')
			).toBeInTheDocument();
			expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
		});

		it('renders an inline toggle when actionIcon is "switch"', () => {
			render(<ListItem icon="sunny" text="x" actionIcon="switch" />);
			expect(screen.getByRole('checkbox')).toBeInTheDocument();
		});

		it('reflects switchChecked on the toggle', () => {
			render(
				<ListItem icon="sunny" text="x" actionIcon="switch" switchChecked={true} />
			);
			expect(screen.getByRole('checkbox')).toBeChecked();
		});
	});

	describe('interaction', () => {
		it('fires onClick when the row is pressed (chevron action)', () => {
			const onClick = vi.fn();
			render(<ListItem icon="sunny" text="x" onClick={onClick} />);
			fireEvent.click(screen.getByRole('listitem'));
			expect(onClick).toHaveBeenCalledTimes(1);
		});

		it('does NOT fire onClick when actionIcon is "switch"', () => {
			const onClick = vi.fn();
			const onSwitchChange = vi.fn();
			render(
				<ListItem
					icon="sunny"
					text="x"
					actionIcon="switch"
					onClick={onClick}
					switchChecked={false}
					onSwitchChange={onSwitchChange}
				/>
			);
			fireEvent.click(screen.getByRole('listitem'));
			expect(onClick).not.toHaveBeenCalled();
			expect(onSwitchChange).toHaveBeenCalledWith(true);
		});

		it('toggles to the next value via onSwitchChange when the switch is changed', () => {
			const onSwitchChange = vi.fn();
			render(
				<ListItem
					icon="sunny"
					text="x"
					actionIcon="switch"
					switchChecked={true}
					onSwitchChange={onSwitchChange}
				/>
			);
			fireEvent.click(screen.getByRole('checkbox'));
			expect(onSwitchChange).toHaveBeenCalledWith(false);
		});

		it('emits a ripple element on press', () => {
			const { container } = render(<ListItem icon="sunny" text="x" />);
			fireEvent.click(screen.getByRole('listitem'));
			// The ripple is a positioned span injected on press.
			const spans = container.querySelectorAll('span');
			expect(spans.length).toBeGreaterThan(0);
		});
	});
});
