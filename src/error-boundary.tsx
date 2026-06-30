import { Component, type ErrorInfo, type ReactNode } from 'react';
import {
	ErrorBoundaryContainer,
	ErrorCard,
	ErrorTitle,
	ErrorMessage,
	ReloadButton,
} from './error-boundary.styles.js';

export interface ErrorBoundaryProps {
	children: ReactNode;
	/**
	 * Reporter invoked when a child throws (e.g. a Sentry/GlitchTip capture).
	 * Injected so kang stays free of any observability backend. Optional — the
	 * fallback still renders without it.
	 */
	onError?: (error: Error, info: ErrorInfo) => void;
	/** Recovery action; defaults to a hard reload of the page. */
	onReload?: () => void;
	/** Fallback heading. */
	title?: ReactNode;
	/** Fallback body copy. */
	message?: ReactNode;
	/** Recovery button label. */
	reloadLabel?: string;
}

interface ErrorBoundaryState {
	hasError: boolean;
}

const DEFAULT_TITLE = 'Something went wrong';
const DEFAULT_MESSAGE =
	'The app hit an unexpected error. Reloading usually fixes it, and your progress is saved.';
const DEFAULT_RELOAD_LABEL = 'Reload';

/**
 * Domain-free root error boundary — the app's last line of defense against a
 * render-time throw white-screening the whole UI. Designed to sit ABOVE the app's
 * Redux/Theme providers, so it is fully self-contained (hard-coded, OS-color-scheme
 * aware styles).
 *
 * The observability backend is injected via `onError`; recovery defaults to a hard
 * reload (override with `onReload`) since persisted state (localStorage/Gun)
 * restores on reload, whereas a soft state reset would just re-render the broken
 * subtree and re-throw.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
	state: ErrorBoundaryState = { hasError: false };

	static getDerivedStateFromError(): ErrorBoundaryState {
		return { hasError: true };
	}

	componentDidCatch(error: Error, info: ErrorInfo): void {
		this.props.onError?.(error, info);
	}

	private handleReload = (): void => {
		if (this.props.onReload) {
			this.props.onReload();
			return;
		}
		window.location.reload();
	};

	render(): ReactNode {
		if (this.state.hasError) {
			return (
				<ErrorBoundaryContainer role="alert">
					<ErrorCard>
						<ErrorTitle>{this.props.title ?? DEFAULT_TITLE}</ErrorTitle>
						<ErrorMessage>{this.props.message ?? DEFAULT_MESSAGE}</ErrorMessage>
						<ReloadButton type="button" onClick={this.handleReload}>
							{this.props.reloadLabel ?? DEFAULT_RELOAD_LABEL}
						</ReloadButton>
					</ErrorCard>
				</ErrorBoundaryContainer>
			);
		}

		return this.props.children;
	}
}

export default ErrorBoundary;
