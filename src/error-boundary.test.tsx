import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBoundary } from './error-boundary.js';

/**
 * ErrorBoundary is the app's last line of defense against a render-time throw
 * white-screening the whole UI. It lives in kang as a domain-free primitive:
 * the reporter (Sentry/GlitchTip/etc.) is INJECTED via `onError`, the recovery
 * action defaults to a hard reload but is overridable, and the fallback copy is
 * customizable with sensible defaults. Renders above any ThemeProvider, so its
 * styles must stay self-contained (hard-coded, OS-color-scheme aware).
 */

function Boom(): never {
	throw new Error('kaboom');
}

describe('ErrorBoundary', () => {
	beforeEach(() => {
		// React logs caught errors to console.error; silence for clean output.
		vi.spyOn(console, 'error').mockImplementation(() => undefined);
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('renders children when nothing throws', () => {
		render(
			<ErrorBoundary>
				<span>all good</span>
			</ErrorBoundary>,
		);
		expect(screen.getByText('all good')).toBeInTheDocument();
	});

	it('renders the fallback and invokes the injected reporter when a child throws', () => {
		const onError = vi.fn();
		render(
			<ErrorBoundary onError={onError}>
				<Boom />
			</ErrorBoundary>,
		);
		expect(screen.getByRole('alert')).toBeInTheDocument();
		expect(onError).toHaveBeenCalledTimes(1);
		expect(onError.mock.calls[0][0]).toBeInstanceOf(Error);
		// Second arg carries React's componentStack.
		expect(onError.mock.calls[0][1]).toHaveProperty('componentStack');
	});

	it('does not require a reporter — still shows the fallback', () => {
		render(
			<ErrorBoundary>
				<Boom />
			</ErrorBoundary>,
		);
		expect(screen.getByRole('alert')).toBeInTheDocument();
	});

	it('hard-reloads by default when the reload button is clicked', async () => {
		const reload = vi.fn();
		Object.defineProperty(window, 'location', {
			configurable: true,
			value: { ...window.location, reload },
		});
		render(
			<ErrorBoundary>
				<Boom />
			</ErrorBoundary>,
		);
		fireEvent.click(screen.getByRole('button'));
		expect(reload).toHaveBeenCalledTimes(1);
	});

	it('uses a custom onReload when provided', async () => {
		const onReload = vi.fn();
		render(
			<ErrorBoundary onReload={onReload}>
				<Boom />
			</ErrorBoundary>,
		);
		fireEvent.click(screen.getByRole('button'));
		expect(onReload).toHaveBeenCalledTimes(1);
	});

	it('renders custom fallback copy when provided', () => {
		render(
			<ErrorBoundary title="Boom happened" message="try again" reloadLabel="Retry">
				<Boom />
			</ErrorBoundary>,
		);
		expect(screen.getByText('Boom happened')).toBeInTheDocument();
		expect(screen.getByText('try again')).toBeInTheDocument();
		expect(screen.getByRole('button')).toHaveTextContent('Retry');
	});
});
