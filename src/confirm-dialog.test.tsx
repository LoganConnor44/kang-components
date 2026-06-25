import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConfirmDialog } from './confirm-dialog.js';

/**
 * Unit coverage for ConfirmDialog. ymy shipped this component untested; these
 * assert the behaviors xunzi's ClearDataConfirm / LogoutConfirm relied on:
 * rendering message / optional description / both button labels, firing the
 * confirm + cancel callbacks on click, and the destructive (red-tinted) styling.
 */

function noop(): void {}

describe('ConfirmDialog', () => {
	it('renders the message and both button labels', () => {
		render(
			<ConfirmDialog
				message="Are you sure?"
				confirmLabel="Yes"
				cancelLabel="No"
				onConfirm={noop}
				onCancel={noop}
			/>
		);
		expect(screen.getByText('Are you sure?')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Yes' })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'No' })).toBeInTheDocument();
	});

	it('renders the optional description when provided', () => {
		render(
			<ConfirmDialog
				message="Sign out?"
				description="You will need to log back in."
				confirmLabel="Sign out"
				cancelLabel="Cancel"
				onConfirm={noop}
				onCancel={noop}
			/>
		);
		expect(screen.getByText('You will need to log back in.')).toBeInTheDocument();
	});

	it('omits the description element entirely when none is given', () => {
		render(
			<ConfirmDialog
				message="Confirm"
				confirmLabel="Yes"
				cancelLabel="No"
				onConfirm={noop}
				onCancel={noop}
			/>
		);
		// Only message + 2 buttons; no description div. The message div and the
		// two buttons are the only direct interactive/text nodes.
		expect(screen.queryByText('You will need to log back in.')).not.toBeInTheDocument();
		expect(screen.getAllByRole('button')).toHaveLength(2);
	});

	it('fires onConfirm (and not onCancel) when the confirm button is clicked', () => {
		const onConfirm = vi.fn();
		const onCancel = vi.fn();
		render(
			<ConfirmDialog
				message="Confirm"
				confirmLabel="Yes"
				cancelLabel="No"
				onConfirm={onConfirm}
				onCancel={onCancel}
			/>
		);
		fireEvent.click(screen.getByRole('button', { name: 'Yes' }));
		expect(onConfirm).toHaveBeenCalledTimes(1);
		expect(onCancel).not.toHaveBeenCalled();
	});

	it('fires onCancel (and not onConfirm) when the cancel button is clicked', () => {
		const onConfirm = vi.fn();
		const onCancel = vi.fn();
		render(
			<ConfirmDialog
				message="Confirm"
				confirmLabel="Yes"
				cancelLabel="No"
				onConfirm={onConfirm}
				onCancel={onCancel}
			/>
		);
		fireEvent.click(screen.getByRole('button', { name: 'No' }));
		expect(onCancel).toHaveBeenCalledTimes(1);
		expect(onConfirm).not.toHaveBeenCalled();
	});

	it('accepts arbitrary ReactNode labels and message (not just strings)', () => {
		render(
			<ConfirmDialog
				message={<span data-testid="msg">Clear all data?</span>}
				confirmLabel={<span data-testid="confirm">Clear</span>}
				cancelLabel={<span data-testid="cancel">Keep</span>}
				onConfirm={noop}
				onCancel={noop}
			/>
		);
		expect(screen.getByTestId('msg')).toBeInTheDocument();
		expect(screen.getByTestId('confirm')).toBeInTheDocument();
		expect(screen.getByTestId('cancel')).toBeInTheDocument();
	});

	it('applies destructive (red-tinted) styling to the confirm button only', () => {
		render(
			<ConfirmDialog
				message="Clear all data?"
				confirmLabel="Clear"
				cancelLabel="Cancel"
				destructive
				onConfirm={noop}
				onCancel={noop}
			/>
		);
		const confirm = screen.getByRole('button', { name: 'Clear' });
		const cancel = screen.getByRole('button', { name: 'Cancel' });
		// Without a ThemeProvider the destructive button falls back to the ymy
		// literal red; the cancel button stays transparent.
		expect(getComputedStyle(confirm).backgroundColor).toBe('rgba(220, 38, 38, 0.1)');
		expect(getComputedStyle(confirm).color).toBe('rgb(220, 38, 38)');
		// jsdom normalizes the `transparent` keyword to rgba(0, 0, 0, 0).
		expect(getComputedStyle(cancel).backgroundColor).toBe('rgba(0, 0, 0, 0)');
	});

	it('renders a non-destructive confirm button transparently by default', () => {
		render(
			<ConfirmDialog
				message="Confirm"
				confirmLabel="Yes"
				cancelLabel="No"
				onConfirm={noop}
				onCancel={noop}
			/>
		);
		const confirm = screen.getByRole('button', { name: 'Yes' });
		// jsdom normalizes the `transparent` keyword to rgba(0, 0, 0, 0).
		expect(getComputedStyle(confirm).backgroundColor).toBe('rgba(0, 0, 0, 0)');
	});

	it('emits a ripple span inside the pressed button on click', () => {
		render(
			<ConfirmDialog
				message="Confirm"
				confirmLabel="Yes"
				cancelLabel="No"
				onConfirm={noop}
				onCancel={noop}
			/>
		);
		const confirm = screen.getByRole('button', { name: 'Yes' });
		expect(confirm.querySelector('span')).toBeNull();
		fireEvent.click(confirm);
		expect(confirm.querySelector('span')).not.toBeNull();
	});
});
