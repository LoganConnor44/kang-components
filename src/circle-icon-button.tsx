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
 * Dependencies: `react-icons` is a hard dependency (the built-in icon set);
 * `styled-components` and `@react-spring/web` are optional peer dependencies, used
 * only by this module — consumers importing just the string primitives never pull
 * them in.
 */

import { type ReactElement } from 'react';
import { animated, useSpring } from '@react-spring/web';
// Named import (not the default) so styled-components resolves consistently
// across bundler and raw ESM/CJS environments — matches ripple.ts.
import { styled } from 'styled-components';
import { BsPerson, BsQrCodeScan } from 'react-icons/bs';
import { pressPrimaryScale } from './press.js';

/** The built-in icon set this button can render. */
export type CircleIconName = 'person' | 'qr';

export type CircleIconButtonProps = {
	/**
	 * Which built-in icon to render.
	 * - `'person'` — person icon (profile).
	 * - `'qr'` — QR-code scan icon (invite/friend).
	 */
	iconComponent: CircleIconName;

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

const ICONS: Record<CircleIconName, ReactElement> = {
	person: <BsPerson />,
	qr: <BsQrCodeScan />,
};

export default function CircleIconButton({
	iconComponent,
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
			<StyledIcon>{ICONS[iconComponent]}</StyledIcon>
		</StyledCircleButton>
	);
}
