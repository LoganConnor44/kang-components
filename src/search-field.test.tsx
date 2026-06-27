import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SearchField } from './search-field.js';

// Renders without a ThemeProvider (kang components fall back to literals). In
// jsdom there's no window.matchMedia, so the field renders expanded immediately.

describe('SearchField', () => {
	it('reflects the controlled value and reports changes', () => {
		const onChange = vi.fn();
		render(<SearchField value="hello" onChange={onChange} ariaLabel="Search" />);
		const input = screen.getByLabelText('Search') as HTMLInputElement;
		expect(input.value).toBe('hello');
		fireEvent.change(input, { target: { value: 'world' } });
		expect(onChange).toHaveBeenCalledWith('world');
	});

	it('hides the clear button when the field is empty', () => {
		render(<SearchField value="" onChange={vi.fn()} ariaLabel="Search" />);
		expect(screen.queryByLabelText('Clear search')).not.toBeInTheDocument();
	});

	it('shows a clear button when there is text and clears on click', () => {
		const onChange = vi.fn();
		render(<SearchField value="abc" onChange={onChange} ariaLabel="Search" />);
		fireEvent.click(screen.getByLabelText('Clear search'));
		expect(onChange).toHaveBeenCalledWith('');
	});

	it('renders the placeholder', () => {
		render(<SearchField value="" onChange={vi.fn()} placeholder="搜索…" ariaLabel="Search" />);
		expect(screen.getByPlaceholderText('搜索…')).toBeInTheDocument();
	});
});
