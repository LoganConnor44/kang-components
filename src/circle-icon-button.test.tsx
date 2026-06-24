import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CircleIconButton from './circle-icon-button.js';

/**
 * Unit coverage for CircleIconButton. ymy shipped this component untested, so
 * these tests capture the behavior xunzi relied on: it renders a button, renders
 * the requested built-in inline-SVG icon, supports an `icon` node override, fires
 * onClick on press, and is robust when no handler is supplied. Both built-in
 * variants ('person' | 'qr') are each exercised. No react-icons dependency.
 */
describe('CircleIconButton', () => {
	it('renders a real <button> element (semantic, type="button")', () => {
		render(<CircleIconButton iconComponent="person" />);
		const btn = screen.getByRole('button');
		expect(btn).toBeInTheDocument();
		expect(btn).toHaveAttribute('type', 'button');
	});

	it('renders the inline person SVG for iconComponent="person"', () => {
		const { container } = render(<CircleIconButton iconComponent="person" />);
		// The built-in glyph is an inline <svg>; assert exactly one icon is drawn.
		const svgs = container.querySelectorAll('svg');
		expect(svgs).toHaveLength(1);
		// The person glyph is a single Bootstrap-icons path.
		expect(svgs[0].querySelectorAll('path')).toHaveLength(1);
	});

	it('renders the inline qr SVG for iconComponent="qr"', () => {
		const { container } = render(<CircleIconButton iconComponent="qr" />);
		const svgs = container.querySelectorAll('svg');
		expect(svgs).toHaveLength(1);
		// The QR-scan glyph is composed of multiple Bootstrap-icons paths.
		expect(svgs[0].querySelectorAll('path').length).toBeGreaterThan(1);
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

	it('renders a custom icon node when `icon` is provided, overriding iconComponent', () => {
		const { container } = render(
			<CircleIconButton
				iconComponent="person"
				icon={<span data-testid="custom-icon">★</span>}
			/>
		);
		// The override is rendered...
		expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
		// ...and the built-in person SVG is NOT.
		expect(container.querySelectorAll('svg')).toHaveLength(0);
	});

	it('still fires onClick with a custom `icon` override', () => {
		const onClick = vi.fn();
		render(
			<CircleIconButton
				iconComponent="qr"
				icon={<span>custom</span>}
				onClick={onClick}
			/>
		);
		fireEvent.click(screen.getByRole('button'));
		expect(onClick).toHaveBeenCalledTimes(1);
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
