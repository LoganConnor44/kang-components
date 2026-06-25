/**
 * ConfirmDialog — a domain-free confirm/cancel prompt: a centered message, an
 * optional description, and stacked confirm + cancel buttons with Material-style
 * ripple press feedback. The confirm button can be marked `destructive` for a
 * red-tinted danger action.
 *
 * Ported from ymy-components (`./confirm-dialog/ConfirmDialog`), where it lived
 * as a 3-file unit (`ConfirmDialog.tsx` + `.types.ts` + `.styles.ts`) and
 * shipped untested. The kang port collapses it into a single flat-ESM module and
 * preserves the public API exactly (`message`, `description`, `confirmLabel`,
 * `cancelLabel`, `destructive`, `onConfirm`, `onCancel`), so xunzi's two
 * re-point sites (`ClearDataConfirm.tsx`, `LogoutConfirm.tsx`) are pure import
 * swaps.
 *
 * Theming follows kang conventions: the destructive button reads the theme's
 * `error` token (with the ymy literal `#dc2626` / `rgba(220, 38, 38, 0.1)` as
 * fallbacks) so it adapts to a `ThemeProvider` (light/dark) yet still renders
 * sensibly without one. Ripple feedback reuses kang's `useRipple` / `Ripple`
 * primitives. `styled-components` and `react` are the only runtime imports.
 */

import { type ReactElement, type ReactNode, type MouseEvent } from 'react';
import { styled } from 'styled-components';
import { Ripple, useRipple } from './ripple.js';

export interface ConfirmDialogProps {
	/** Primary message displayed at the top. */
	message: ReactNode;
	/** Optional secondary description below the message. */
	description?: ReactNode;
	/** Label for the confirm button. */
	confirmLabel: ReactNode;
	/** Label for the cancel button. */
	cancelLabel: ReactNode;
	/** Whether the confirm action is destructive (red-tinted button). */
	destructive?: boolean;
	/** Callback when confirm is clicked. */
	onConfirm: () => void;
	/** Callback when cancel is clicked. */
	onCancel: () => void;
}

type ThemeColors = { colors?: Record<string, string | undefined> };

/** Convert a hex color (`#rrggbb`) to an `r, g, b` triple for rgba() usage. */
function hexToRgbTriple(hex: string): string | null {
	const h = hex.replace('#', '');
	if (h.length !== 6) return null;
	const r = parseInt(h.slice(0, 2), 16);
	const g = parseInt(h.slice(2, 4), 16);
	const b = parseInt(h.slice(4, 6), 16);
	if ([r, g, b].some((n) => Number.isNaN(n))) return null;
	return `${r}, ${g}, ${b}`;
}

const DialogContainer = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
`;

const DialogMessage = styled.div`
	text-align: center;
	padding: 0.5rem 1rem;
	font-weight: 300;
`;

const DialogDescription = styled.div`
	text-align: center;
	padding: 0 1rem 1rem;
	font-size: 0.875rem;
	opacity: 0.7;
`;

const DialogButton = styled.button<{ $destructive?: boolean }>`
	position: relative;
	z-index: 1;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 1rem;
	font-family: inherit;
	font-size: 1.125rem;
	font-weight: 300;
	border: none;
	border-radius: 12px;
	background-color: ${({ $destructive, theme }) => {
		if (!$destructive) return 'transparent';
		const error = (theme as ThemeColors)?.colors?.error;
		const triple = error ? hexToRgbTriple(error) : null;
		return triple ? `rgba(${triple}, 0.1)` : 'rgba(220, 38, 38, 0.1)';
	}};
	color: ${({ $destructive, theme }) => {
		if (!$destructive) return 'inherit';
		return (theme as ThemeColors)?.colors?.error ?? '#dc2626';
	}};
	cursor: pointer;
	outline: none;
	overflow: hidden;
	-webkit-tap-highlight-color: transparent;
`;

export function ConfirmDialog({
	message,
	description,
	confirmLabel,
	cancelLabel,
	destructive = false,
	onConfirm,
	onCancel,
}: ConfirmDialogProps): ReactElement {
	const { ripple, trigger, isTarget } = useRipple<'confirm' | 'cancel'>();

	const handleConfirm = (e: MouseEvent<HTMLButtonElement>) => {
		trigger(e, 'confirm');
		onConfirm();
	};

	const handleCancel = (e: MouseEvent<HTMLButtonElement>) => {
		trigger(e, 'cancel');
		onCancel();
	};

	return (
		<DialogContainer>
			<DialogMessage>{message}</DialogMessage>
			{description && <DialogDescription>{description}</DialogDescription>}
			<DialogButton $destructive={destructive} onClick={handleConfirm}>
				{isTarget('confirm') && ripple && (
					<Ripple key={ripple.key} $x={ripple.x} $y={ripple.y} />
				)}
				{confirmLabel}
			</DialogButton>
			<DialogButton onClick={handleCancel}>
				{isTarget('cancel') && ripple && (
					<Ripple key={ripple.key} $x={ripple.x} $y={ripple.y} />
				)}
				{cancelLabel}
			</DialogButton>
		</DialogContainer>
	);
}

export default ConfirmDialog;
