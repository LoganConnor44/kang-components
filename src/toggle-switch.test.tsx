import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ToggleSwitch from './toggle-switch.js';

/**
 * Unit coverage for the ported ToggleSwitch. ymy shipped this component largely
 * untested; this file is the real coverage for the behavior xunzi relies on:
 * render, uncontrolled/controlled state, change/toggle callback, disabled, and
 * the animated thumb position reflecting state.
 *
 * The visible switch is a hidden checkbox (`role="checkbox"`) plus styled spans;
 * we query the checkbox for state and assert the thumb's `left` for the animated
 * position.
 */

const getCheckbox = () => screen.getByRole('checkbox') as HTMLInputElement;

// The thumb is the styled span that animates its `left` between 0px (off) and
// 14px (on). It is the last span child of the label.
const getThumb = (): HTMLElement => {
	const label = screen.getByRole('checkbox').closest('label')!;
	const spans = label.querySelectorAll('span');
	return spans[spans.length - 1] as HTMLElement;
};

describe('ToggleSwitch', () => {
	it('renders a checkbox, unchecked by default', () => {
		render(<ToggleSwitch />);
		const cb = getCheckbox();
		expect(cb).toBeInTheDocument();
		expect(cb.checked).toBe(false);
	});

	it('honors defaultChecked for the uncontrolled initial state', () => {
		render(<ToggleSwitch defaultChecked />);
		expect(getCheckbox().checked).toBe(true);
	});

	it('toggles its own state when uncontrolled', () => {
		render(<ToggleSwitch />);
		const cb = getCheckbox();
		expect(cb.checked).toBe(false);
		fireEvent.click(cb);
		expect(cb.checked).toBe(true);
		fireEvent.click(cb);
		expect(cb.checked).toBe(false);
	});

	it('fires onChange with the next value on toggle', () => {
		const onChange = vi.fn();
		render(<ToggleSwitch onChange={onChange} />);
		fireEvent.click(getCheckbox());
		expect(onChange).toHaveBeenCalledTimes(1);
		expect(onChange).toHaveBeenCalledWith(true);
	});

	it('reflects the controlled value and does not self-update', () => {
		const onChange = vi.fn();
		const { rerender } = render(
			<ToggleSwitch checked={false} onChange={onChange} />
		);
		const cb = getCheckbox();
		expect(cb.checked).toBe(false);

		fireEvent.click(cb);
		// Controlled: onChange fires but internal state must not flip it on.
		expect(onChange).toHaveBeenCalledWith(true);
		expect(cb.checked).toBe(false);

		// Parent applies the new value.
		rerender(<ToggleSwitch checked={true} onChange={onChange} />);
		expect(getCheckbox().checked).toBe(true);
	});

	it('does not toggle or call onChange when disabled', () => {
		const onChange = vi.fn();
		render(<ToggleSwitch disabled onChange={onChange} />);
		const cb = getCheckbox();
		expect(cb.disabled).toBe(true);
		// fireEvent.change bypasses the disabled-click guard the DOM normally
		// enforces, proving the component's own `if (disabled) return` short-
		// circuits before onChange.
		fireEvent.change(cb, { target: { checked: true } });
		expect(onChange).not.toHaveBeenCalled();
	});

	it('animates the thumb position to reflect on/off state', () => {
		const { rerender } = render(<ToggleSwitch checked={false} />);
		// Off: thumb sits at left: 0px and carries an animated `left` transition.
		const offThumb = getThumb();
		expect(getComputedStyle(offThumb).left).toBe('0px');
		expect(getComputedStyle(offThumb).transition).toContain('left');

		// On: thumb slides to left: 14px.
		rerender(<ToggleSwitch checked={true} />);
		expect(getComputedStyle(getThumb()).left).toBe('14px');
	});
});
