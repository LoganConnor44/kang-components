import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SearchBar } from './search-bar.js';

// Renders without a ThemeProvider (primitives fall back to literals). jsdom has
// no matchMedia, so the SearchField renders expanded and is interactive.

describe('SearchBar', () => {
	it('renders the field with the value and reports changes', () => {
		const onChange = vi.fn();
		render(<SearchBar active value="新闻" onChange={onChange} ariaLabel="Search" />);
		const input = screen.getByLabelText('Search') as HTMLInputElement;
		expect(input.value).toBe('新闻');
		fireEvent.change(input, { target: { value: '经济' } });
		expect(onChange).toHaveBeenCalledWith('经济');
	});

	it('renders a back button only when onBack is given, and calls it', () => {
		const { rerender } = render(<SearchBar active value="" onChange={vi.fn()} ariaLabel="Search" />);
		expect(screen.queryByLabelText('Back')).not.toBeInTheDocument();

		const onBack = vi.fn();
		rerender(<SearchBar active value="" onChange={vi.fn()} onBack={onBack} backAriaLabel="Close search" ariaLabel="Search" />);
		fireEvent.click(screen.getByLabelText('Close search'));
		expect(onBack).toHaveBeenCalled();
	});

	it('renders an optional title slot', () => {
		render(<SearchBar active value="" onChange={vi.fn()} title={<h2>搜索</h2>} ariaLabel="Search" />);
		expect(screen.getByText('搜索')).toBeInTheDocument();
	});
});
