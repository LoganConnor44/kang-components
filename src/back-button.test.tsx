import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import BackButton from './back-button.js';

/**
 * Unit coverage for the kang BackButton. ymy shipped this component untested;
 * these assertions pin the behavior xunzi relied on (renders an icon, fires
 * onClick) plus the kang upgrades (semantic button, disabled, a11y label).
 */
describe('BackButton', () => {
	it('renders a semantic button with the default accessible label', () => {
		render(<BackButton />);
		const btn = screen.getByRole('button', { name: 'Back' });
		expect(btn).toBeInTheDocument();
		expect(btn).toHaveAttribute('type', 'button');
	});

	it('renders an icon (svg) inside the button', () => {
		const { container } = render(<BackButton />);
		const svg = container.querySelector('svg');
		expect(svg).toBeInTheDocument();
		// Default size is 1.5rem.
		expect(svg).toHaveAttribute('height', '1.5rem');
		expect(svg).toHaveAttribute('width', '1.5rem');
	});

	it('honors a custom size prop', () => {
		const { container } = render(<BackButton size="3rem" />);
		const svg = container.querySelector('svg');
		expect(svg).toHaveAttribute('height', '3rem');
		expect(svg).toHaveAttribute('width', '3rem');
	});

	it('honors a custom ariaLabel', () => {
		render(<BackButton ariaLabel="Go back to home" />);
		expect(screen.getByRole('button', { name: 'Go back to home' })).toBeInTheDocument();
	});

	it('passes a className through to the button element', () => {
		render(<BackButton className="banner-back" />);
		expect(screen.getByRole('button')).toHaveClass('banner-back');
	});

	it('fires onClick when pressed', () => {
		const onClick = vi.fn();
		render(<BackButton onClick={onClick} />);
		fireEvent.click(screen.getByRole('button'));
		expect(onClick).toHaveBeenCalledTimes(1);
	});

	it('does not throw when clicked without an onClick handler', () => {
		render(<BackButton />);
		expect(() => fireEvent.click(screen.getByRole('button'))).not.toThrow();
	});

	it('renders a ripple overlay on press', () => {
		const { container } = render(<BackButton onClick={() => {}} />);
		const btn = screen.getByRole('button');
		// No ripple before any interaction.
		expect(container.querySelectorAll('span').length).toBe(0);
		fireEvent.click(btn);
		// A Ripple <span> is mounted for the press.
		expect(container.querySelectorAll('span').length).toBeGreaterThan(0);
	});

	describe('disabled', () => {
		it('marks the button disabled', () => {
			render(<BackButton disabled onClick={() => {}} />);
			expect(screen.getByRole('button')).toBeDisabled();
		});

		it('does not fire onClick when disabled', () => {
			const onClick = vi.fn();
			render(<BackButton disabled onClick={onClick} />);
			// fireEvent dispatches directly; the handler must guard internally too.
			fireEvent.click(screen.getByRole('button'));
			expect(onClick).not.toHaveBeenCalled();
		});

		it('does not render a ripple when disabled', () => {
			const { container } = render(<BackButton disabled onClick={() => {}} />);
			fireEvent.click(screen.getByRole('button'));
			expect(container.querySelectorAll('span').length).toBe(0);
		});
	});
});
