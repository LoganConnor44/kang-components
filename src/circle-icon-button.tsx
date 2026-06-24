/**
 * CircleIconButton — a round, themed icon button with a spring entry animation.
 *
 * Ported faithfully from ymy-components (`./buttons/CircleIconButton`). It renders
 * one of a small set of built-in icons (`person`, `qr`) inside a circular outlined
 * button that scales/fades in on mount via react-spring, and fires `onClick` when
 * pressed. The two xunzi sites that consume it (HeroBanner, ProfileButton) drive it
 * purely through the `iconComponent` string + `onClick`, so that API is preserved
 * 1:1 to keep the re-point a pure import swap.
 *
 * Theming: the border reads `theme.colors.onPrimary` and the icon reads
 * `theme.colors.onSurface` off styled-components' `props.theme`, with literal
 * fallbacks so it renders sensibly with or without a `ThemeProvider`.
 *
 * Press feedback: layered on top of ymy's behavior using kang's `pressPrimary`
 * (the icon-button tier). The entry animation owns `transform` via react-spring,
 * so press uses the CSS `scale` property (`pressPrimaryScale`) to avoid fighting it.
 *
 * Icons: ymy hard-depended on `react-icons` (BsPerson / BsQrCodeScan). To keep
 * kang dependency-light and domain-free, the same two glyphs ship as inline SVGs
 * (matching Bootstrap-icons path data) selectable via `iconComponent`, and
 * consumers may pass any node via `icon` — the same pattern as BannerButton.
 *
 * `styled-components` and `@react-spring/web` are optional peer dependencies, used
 * only by this module — consumers importing just the string primitives never pull
 * them in.
 */

import { type ReactElement, type ReactNode } from 'react';
import { animated, useSpring } from '@react-spring/web';
// Named import (not the default) so styled-components resolves consistently
// across bundler and raw ESM/CJS environments — matches ripple.ts.
import { styled } from 'styled-components';
import { pressPrimaryScale } from './press.js';

/** The built-in icon set this button can render. */
export type CircleIconName = 'person' | 'qr';

export type CircleIconButtonProps = {
	/**
	 * Which built-in icon to render. Ignored when an explicit `icon` node is
	 * provided.
	 * - `'person'` — person icon (profile).
	 * - `'qr'` — QR-code scan icon (invite/friend).
	 */
	iconComponent: CircleIconName;

	/**
	 * An explicit icon node, overriding `iconComponent`. Lets consumers supply
	 * their own glyph (e.g. a react-icons element) without kang depending on an
	 * icon library — the same override pattern as BannerButton.
	 */
	icon?: ReactNode;

	/**
	 * Optional click handler, invoked when the button is pressed. If omitted the
	 * button still renders and is interactive but performs no action.
	 */
	onClick?: () => void;
};

type ThemeColors = { colors?: { onPrimary?: string; onSurface?: string } };

const StyledCircleButton = styled(animated.button)`
	width: 2.5rem;
	height: 2.5rem;
	padding: 0;
	border-radius: 50%;
	border: 1px solid
		${({ theme }) => (theme as ThemeColors)?.colors?.onPrimary ?? 'white'};
	background: transparent;
	display: flex;
	align-items: center;
	justify-content: center;
	cursor: pointer;
	${pressPrimaryScale()}
`;

const StyledIcon = styled.span`
	display: flex;
	color: ${({ theme }) => (theme as ThemeColors)?.colors?.onSurface ?? 'black'};
	font-size: 1.125rem;
`;

/** Inline BsPerson (react-icons/bs) — Bootstrap-icons path data, glyph unchanged. */
const PersonIcon = (): ReactElement => (
	<svg
		stroke="currentColor"
		fill="currentColor"
		strokeWidth="0"
		viewBox="0 0 16 16"
		height="1em"
		width="1em"
		xmlns="http://www.w3.org/2000/svg"
		aria-hidden="true"
		focusable="false"
	>
		<path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6m2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0m4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4m-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10s-3.516.68-4.168 1.332c-.678.678-.83 1.418-.832 1.664z" />
	</svg>
);

/** Inline BsQrCodeScan (react-icons/bs) — Bootstrap-icons path data, glyph unchanged. */
const QrIcon = (): ReactElement => (
	<svg
		stroke="currentColor"
		fill="currentColor"
		strokeWidth="0"
		viewBox="0 0 16 16"
		height="1em"
		width="1em"
		xmlns="http://www.w3.org/2000/svg"
		aria-hidden="true"
		focusable="false"
	>
		<path d="M0 .5A.5.5 0 0 1 .5 0h3a.5.5 0 0 1 0 1H1v2.5a.5.5 0 0 1-1 0zm12 0a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5v3a.5.5 0 0 1-1 0V1h-2.5a.5.5 0 0 1-.5-.5M.5 12a.5.5 0 0 1 .5.5V15h2.5a.5.5 0 0 1 0 1h-3a.5.5 0 0 1-.5-.5v-3a.5.5 0 0 1 .5-.5m15 0a.5.5 0 0 1 .5.5v3a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1 0-1H15v-2.5a.5.5 0 0 1 .5-.5M4 4h1v1H4z" />
		<path d="M7 2H2v5h5zM3 3h3v3H3zm2 8H4v1h1z" />
		<path d="M7 9H2v5h5zm-4 1h3v3H3zm8-6h1v1h-1z" />
		<path d="M9 2h5v5H9zm1 1v3h3V3zM8 8v2h1v1H8v1h2v-2h1v2h1v-1h2v-1h-3V8zm2 2H9V9h1zm4 2h-1v1h-2v1h3zm-4 2v-1H8v1z" />
		<path d="M12 9h2V8h-2z" />
	</svg>
);

const ICONS: Record<CircleIconName, ReactElement> = {
	person: <PersonIcon />,
	qr: <QrIcon />,
};

function resolveIcon(icon: ReactNode, iconComponent: CircleIconName): ReactNode {
	if (icon !== undefined) return icon;
	return ICONS[iconComponent];
}

export default function CircleIconButton({
	iconComponent,
	icon,
	onClick,
}: CircleIconButtonProps): ReactElement {
	const animatedStyles = useSpring({
		from: { opacity: 0, scale: 0.5 },
		to: { opacity: 1, scale: 1 },
	});

	const handleClick = () => {
		if (onClick) {
			onClick();
		}
	};

	return (
		<StyledCircleButton
			type="button"
			style={animatedStyles}
			onClick={handleClick}
		>
			<StyledIcon>{resolveIcon(icon, iconComponent)}</StyledIcon>
		</StyledCircleButton>
	);
}
