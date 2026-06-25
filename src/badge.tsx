/**
 * Badge — a domain-free pill that displays a prominent value with an optional
 * label, in one of a few visual variants.
 *
 * Ported from ymy-components (`./badge/Badge`), where it lived as a 3-file unit
 * (`Badge.tsx` + `Badge.types.ts` + `Badge.styles.ts`) and shipped untested.
 * The kang port collapses it into a single flat-ESM module and preserves the
 * public API exactly (`value`, `label`, `variant`), so xunzi's re-point site
 * (`StreakBadge.tsx`) is a pure import swap.
 *
 * Theming follows kang conventions: every color reads a styled-components
 * `theme.colors.*` token with a literal fallback, so the badge adapts to a
 * `ThemeProvider` (light/dark) yet still renders sensibly without one. The ymy
 * source hardcoded the `success` variant's green; the kang port routes it
 * through the theme's `successContainer`/`successDark` tokens (same literal
 * fallbacks) so it matches mode like every other variant.
 *
 * `styled-components` and `react` are the only things this module pulls in.
 */

import { type ReactElement, type ReactNode } from 'react';
import { styled, css } from 'styled-components';

export type BadgeVariant = 'primary' | 'muted' | 'success';

export interface BadgeProps {
	/** The primary value displayed prominently. */
	value: ReactNode;
	/** Optional label displayed next to the value (rendered uppercase). */
	label?: string;
	/** Visual variant (default: `'primary'`). */
	variant?: BadgeVariant;
	/** Optional class name passthrough for layout/positioning by the consumer. */
	className?: string;
}

type ThemeColors = { colors?: Record<string, string | undefined> };

const containerVariant = {
	primary: css`
		background: ${({ theme }) =>
			(theme as ThemeColors)?.colors?.whiteLow ?? 'rgba(255, 255, 255, 0.2)'};
	`,
	muted: css`
		background: ${({ theme }) =>
			(theme as ThemeColors)?.colors?.surfaceVariant ?? 'rgba(0, 0, 0, 0.06)'};
	`,
	success: css`
		background: ${({ theme }) =>
			(theme as ThemeColors)?.colors?.successContainer ?? 'rgba(34, 197, 94, 0.15)'};
	`,
};

const BadgeContainer = styled.div<{ $variant: BadgeVariant }>`
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 0.25rem;
	padding: 0.75rem 1rem;
	border-radius: 1rem;
	min-width: 4rem;
	${({ $variant }) => containerVariant[$variant]}
`;

const BadgeValue = styled.span<{ $variant: BadgeVariant }>`
	font-size: 1.25rem;
	font-weight: 600;
	line-height: 1;
	color: ${({ $variant, theme }) => {
		const colors = (theme as ThemeColors)?.colors;
		if ($variant === 'success') return colors?.successDark ?? '#16a34a';
		return colors?.primaryDarker ?? colors?.primary ?? '#333';
	}};
`;

const BadgeLabel = styled.span`
	font-size: 0.625rem;
	font-weight: 500;
	color: ${({ theme }) => (theme as ThemeColors)?.colors?.onSurface ?? '#333'};
	text-transform: uppercase;
	letter-spacing: 0.05em;
`;

export function Badge({
	value,
	label,
	variant = 'primary',
	className,
}: BadgeProps): ReactElement {
	return (
		<BadgeContainer $variant={variant} className={className}>
			<BadgeValue $variant={variant}>{value}</BadgeValue>
			{label && <BadgeLabel>{label}</BadgeLabel>}
		</BadgeContainer>
	);
}

export default Badge;
