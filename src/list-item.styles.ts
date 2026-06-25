/**
 * Styled building blocks for {@link ListItem} and its list container.
 *
 * Ported from ymy-components (`./collections/ListItem.styles` +
 * `./components/ToggleSwitch`) and kept as a co-located pair so the list
 * semantics, spacing and the inline toggle travel with the component. All color
 * values read off styled-components' `props.theme` with literal fallbacks (the
 * same fallbacks ymy used), so the primitives render sensibly with or without a
 * themed `ThemeProvider` — matching the rest of kang (ripple.ts,
 * circle-icon-button.tsx).
 *
 * `styled-components` is an optional peer dependency, pulled in only by this
 * module (and the component that imports it). Consumers importing just the
 * string / press primitives never load it.
 */

// Named import (not the default) so styled-components resolves consistently
// across bundler and raw ESM/CJS environments — matches ripple.ts.
import { styled } from 'styled-components';

type ThemeColors = {
	colors?: {
		onSurface?: string;
		scrimLight?: string;
		toggleTrackOn?: string;
		toggleTrackOff?: string;
		toggleThumbOn?: string;
		toggleThumbOff?: string;
		toggleHoverOn?: string;
		toggleHoverOff?: string;
		toggleFocusOn?: string;
		toggleFocusOff?: string;
		shadowLight?: string;
		shadowLighter?: string;
	};
};

/**
 * The list container: a `<ul>` that lays its {@link ListItem} children out in a
 * centered column with the browser's default inline padding removed. Ported 1:1
 * from ymy so list semantics + spacing are preserved.
 */
export const UnorderedListItemContainer = styled.ul`
	display: flex;
	flex-direction: column;
	justify-content: center;
	padding-inline-start: unset;
`;

/** The pressable row element — a relatively-positioned `<li>` that clips its ripple. */
export const ListItemContainer = styled.li`
	position: relative;
	list-style: none;
	cursor: pointer;
	overflow: hidden;
	-webkit-tap-highlight-color: transparent;
	border-bottom: 1px solid
		${({ theme }) =>
			(theme as ThemeColors)?.colors?.scrimLight ?? 'rgba(0, 0, 0, 0.3)'};
`;

/** Row inner layout: left content (icon + text) pushed apart from the trailing action. */
export const ListItemContent = styled.div`
	display: flex;
	flex-direction: row;
	justify-content: space-between;
	align-items: center;
	padding: 0.5rem 0.75rem;
`;

/** Left cluster: the leading icon and the text, spaced apart. */
export const ListItemLeftContent = styled.div`
	display: flex;
	flex-direction: row;
	gap: 2rem;
	align-items: center;
`;

/** Wrapper that vertically centers an icon (leading or trailing). */
export const ListItemIcon = styled.div`
	display: flex;
	flex-direction: column;
	justify-content: center;
	color: ${({ theme }) => (theme as ThemeColors)?.colors?.onSurface ?? 'black'};
`;

/** The row's text span. */
export const ListItemText = styled.span`
	font-size: 1rem;
	color: ${({ theme }) => (theme as ThemeColors)?.colors?.onSurface ?? 'black'};
`;

/* ── Inline toggle switch ──────────────────────────────────────────────────
 * ymy's ListItem rendered its `ToggleSwitch` component when `actionIcon` was
 * 'switch'. kang has no ToggleSwitch yet, so the same Material-style toggle is
 * inlined here, reading kang's `toggle*` theme tokens with the identical literal
 * fallbacks ymy used. Look + behavior are preserved 1:1.
 */

/** Hover/focus ripple disc behind the thumb (Material affordance). */
export const SwitchRipple = styled.span<{ $checked: boolean }>`
	position: absolute;
	top: 50%;
	left: ${({ $checked }) => ($checked ? '14px' : '0px')};
	transform: translate(-50%, -50%) translateX(50%);
	width: 38px;
	height: 38px;
	border-radius: 50%;
	background-color: transparent;
	transition: background-color 150ms cubic-bezier(0.4, 0, 0.2, 1),
		left 400ms cubic-bezier(0.34, 1.56, 0.64, 1);
	pointer-events: none;
`;

/** The toggle's label/container; stops click propagation so the row isn't double-fired. */
export const SwitchContainer = styled.label<{ $checked: boolean }>`
	position: relative;
	display: inline-flex;
	align-items: center;
	cursor: pointer;
	-webkit-tap-highlight-color: transparent;

	@media (hover: hover) {
		&:hover ${SwitchRipple} {
			background-color: ${({ $checked, theme }) =>
				$checked
					? (theme as ThemeColors)?.colors?.toggleHoverOn ??
					  'rgba(72, 159, 181, 0.08)'
					: (theme as ThemeColors)?.colors?.toggleHoverOff ??
					  'rgba(0, 0, 0, 0.04)'};
		}
	}

	&:focus-within ${SwitchRipple} {
		background-color: ${({ $checked, theme }) =>
			$checked
				? (theme as ThemeColors)?.colors?.toggleFocusOn ??
				  'rgba(72, 159, 181, 0.12)'
				: (theme as ThemeColors)?.colors?.toggleFocusOff ??
				  'rgba(0, 0, 0, 0.06)'};
	}
`;

export const SwitchInput = styled.input`
	opacity: 0;
	width: 0;
	height: 0;
	position: absolute;
`;

export const SwitchTrack = styled.span<{ $checked: boolean }>`
	width: 34px;
	height: 14px;
	background-color: ${({ $checked, theme }) =>
		$checked
			? (theme as ThemeColors)?.colors?.toggleTrackOn ??
			  'rgba(72, 159, 181, 0.5)'
			: (theme as ThemeColors)?.colors?.toggleTrackOff ?? 'rgba(0, 0, 0, 0.38)'};
	border-radius: 7px;
	transition: background-color 150ms cubic-bezier(0.4, 0, 0.2, 1);
`;

export const SwitchThumb = styled.span<{ $checked: boolean }>`
	position: absolute;
	top: 50%;
	left: ${({ $checked }) => ($checked ? '14px' : '0px')};
	transform: translateY(-50%) scale(${({ $checked }) => ($checked ? 1.1 : 1)});
	width: 20px;
	height: 20px;
	background-color: ${({ $checked, theme }) =>
		$checked
			? (theme as ThemeColors)?.colors?.toggleThumbOn ?? '#489fb5'
			: (theme as ThemeColors)?.colors?.toggleThumbOff ?? '#fafafa'};
	border-radius: 50%;
	box-shadow: 0px 2px 1px -1px
			${({ theme }) =>
				(theme as ThemeColors)?.colors?.shadowLight ?? 'rgba(0, 0, 0, 0.2)'},
		0px 1px 1px 0px
			${({ theme }) =>
				(theme as ThemeColors)?.colors?.shadowLighter ?? 'rgba(0, 0, 0, 0.14)'},
		0px 1px 3px 0px
			${({ theme }) =>
				(theme as ThemeColors)?.colors?.shadowLighter ?? 'rgba(0, 0, 0, 0.12)'};
	transition: left 400ms cubic-bezier(0.34, 1.56, 0.64, 1),
		transform 400ms cubic-bezier(0.34, 1.56, 0.64, 1),
		background-color 150ms cubic-bezier(0.4, 0, 0.2, 1);
	pointer-events: none;
`;
