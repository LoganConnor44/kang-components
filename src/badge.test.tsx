import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge } from './badge.js';

/**
 * Unit coverage for Badge. ymy shipped this component untested; these assert the
 * behaviors xunzi's StreakBadge relied on: rendering the value, the optional
 * uppercase label, the three variants, and the numeric edge cases a streak
 * counter actually produces (zero, large numbers, ReactNode values).
 */

describe('Badge', () => {
	it('renders the value', () => {
		render(<Badge value={7} />);
		expect(screen.getByText('7')).toBeInTheDocument();
	});

	it('renders the optional label alongside the value', () => {
		render(<Badge value={7} label="streak" />);
		expect(screen.getByText('7')).toBeInTheDocument();
		expect(screen.getByText('streak')).toBeInTheDocument();
	});

	it('omits the label element entirely when no label is given', () => {
		const { container } = render(<Badge value={7} />);
		// Only the value span renders; no second (label) span.
		expect(container.querySelectorAll('span')).toHaveLength(1);
	});

	it('renders zero as a value (not treated as falsy/blank)', () => {
		render(<Badge value={0} label="streak" />);
		expect(screen.getByText('0')).toBeInTheDocument();
	});

	it('renders large multi-digit numbers verbatim (no overflow cap)', () => {
		render(<Badge value={1234} label="streak" />);
		expect(screen.getByText('1234')).toBeInTheDocument();
	});

	it('accepts an arbitrary ReactNode as the value', () => {
		render(<Badge value={<span data-testid="custom">🔥</span>} />);
		expect(screen.getByTestId('custom')).toBeInTheDocument();
	});

	it('renders an empty-string label as no label element', () => {
		// label="" is falsy, so the label span must not render.
		const { container } = render(<Badge value={1} label="" />);
		expect(container.querySelectorAll('span')).toHaveLength(1);
	});

	it('defaults to the primary variant', () => {
		render(<Badge value={1} />);
		// primary uses the whiteLow fallback background (no theme provider).
		const container = screen.getByText('1').parentElement as HTMLElement;
		expect(getComputedStyle(container).background).toContain('rgba(255, 255, 255, 0.2)');
	});

	it('applies the muted variant background', () => {
		render(<Badge value={1} variant="muted" />);
		const container = screen.getByText('1').parentElement as HTMLElement;
		expect(getComputedStyle(container).background).toContain('rgba(0, 0, 0, 0.06)');
	});

	it('applies the success variant background and value color', () => {
		render(<Badge value={1} variant="success" />);
		const value = screen.getByText('1');
		const container = value.parentElement as HTMLElement;
		expect(getComputedStyle(container).background).toContain('rgba(34, 197, 94, 0.15)');
		// success value color falls back to the success green when unthemed.
		expect(getComputedStyle(value).color).toBe('rgb(22, 163, 74)');
	});

	it('forwards a className to the container for layout positioning', () => {
		render(<Badge value={1} className="my-badge" />);
		const container = screen.getByText('1').parentElement as HTMLElement;
		expect(container).toHaveClass('my-badge');
	});

	it('renders the label uppercased via CSS text-transform', () => {
		render(<Badge value={1} label="streak" />);
		// Source casing is preserved in the DOM; uppercasing is presentational.
		const label = screen.getByText('streak');
		expect(getComputedStyle(label).textTransform).toBe('uppercase');
	});
});
