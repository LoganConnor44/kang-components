import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CircleIconButton from './circle-icon-button.js';

/**
 * Unit coverage for CircleIconButton. ymy shipped this component untested, so
 * these tests capture the behavior xunzi relied on: it renders a button, renders
 * the requested built-in icon, fires onClick on press, and is robust when no
 * handler is supplied. Variants ('person' | 'qr') are each exercised.
 */
describe('CircleIconButton', () => {
	it('renders a real <button> element (semantic, type="button")', () => {
		render(<CircleIconButton iconComponent="person" />);
		const btn = screen.getByRole('button');
		expect(btn).toBeInTheDocument();
		expect(btn).toHaveAttribute('type', 'button');
	});

	it('renders the person icon for iconComponent="person"', () => {
		const { container } = render(<CircleIconButton iconComponent="person" />);
		// react-icons render an <svg>; assert exactly one icon is drawn.
		const svgs = container.querySelectorAll('svg');
		expect(svgs).toHaveLength(1);
	});

	it('renders the qr icon for iconComponent="qr"', () => {
		const { container } = render(<CircleIconButton iconComponent="qr" />);
		const svgs = container.querySelectorAll('svg');
		expect(svgs).toHaveLength(1);
	});

	it('renders a different icon for "person" vs "qr"', () => {
		const { container: personC } = render(
			<CircleIconButton iconComponent="person" />
		);
		const { container: qrC } = render(<CircleIconButton iconComponent="qr" />);
		const personSvg = personC.querySelector('svg')?.innerHTML;
		const qrSvg = qrC.querySelector('svg')?.innerHTML;
		expect(personSvg).toBeTruthy();
		expect(qrSvg).toBeTruthy();
		expect(personSvg).not.toEqual(qrSvg);
	});

	it('fires onClick when the button is pressed', () => {
		const onClick = vi.fn();
		render(<CircleIconButton iconComponent="qr" onClick={onClick} />);
		fireEvent.click(screen.getByRole('button'));
		expect(onClick).toHaveBeenCalledTimes(1);
	});

	it('fires onClick once per click', () => {
		const onClick = vi.fn();
		render(<CircleIconButton iconComponent="person" onClick={onClick} />);
		const btn = screen.getByRole('button');
		fireEvent.click(btn);
		fireEvent.click(btn);
		fireEvent.click(btn);
		expect(onClick).toHaveBeenCalledTimes(3);
	});

	it('does not throw when clicked without an onClick handler', () => {
		render(<CircleIconButton iconComponent="person" />);
		expect(() => fireEvent.click(screen.getByRole('button'))).not.toThrow();
	});

	it('applies an inline style (the react-spring entry animation) to the button', () => {
		render(<CircleIconButton iconComponent="qr" />);
		const btn = screen.getByRole('button');
		// react-spring writes opacity/scale onto the element's inline style.
		expect(btn.getAttribute('style')).toMatch(/opacity/);
	});
});
