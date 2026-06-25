/**
 * ToggleSwitch — a Material-style on/off switch with an animated thumb.
 *
 * Ported faithfully from ymy-components (`./components/ToggleSwitch`). The public
 * API is preserved 1:1 so xunzi's single re-point site (Profile.tsx, the error-
 * reporting toggle) is a pure import swap: it drives the switch through `checked`
 * + `onChange`, both unchanged here.
 *
 * Behavior (uncontrolled / controlled): if `checked` is provided the component is
 * controlled and renders that value; otherwise it owns internal state seeded by
 * `defaultChecked`. Either way `onChange(next)` fires on toggle (suppressed when
 * `disabled`). The hidden checkbox is blurred on change to drop the focus ring,
 * and the label stops click propagation so it can sit inside clickable rows.
 *
 * Fluid animation (a core principle): the thumb slides + slightly scales between
 * the off/on positions via a spring-like cubic-bezier CSS transition, and the
 * track / ripple cross-fade their colors — preserved exactly from ymy.
 *
 * Theming: track / thumb / hover / focus colors read off styled-components'
 * `props.theme.colors.toggle*` tokens (assembled by kang's `buildTheme`), with the
 * same literal fallbacks ymy shipped so it renders sensibly with or without a
 * `ThemeProvider`. `styled-components` is an optional peer dependency, used only by
 * this module.
 */

import { type ChangeEvent, type ReactElement, useState } from 'react';
// Named import (not the default) so styled-components resolves consistently
// across bundler and raw ESM/CJS environments — matches ripple.ts / the other
// styled kang primitives.
import { styled } from 'styled-components';

type ToggleColors = {
	colors?: {
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

const c = (theme: unknown): NonNullable<ToggleColors['colors']> =>
	(theme as ToggleColors)?.colors ?? {};

const SwitchInput = styled.input`
	opacity: 0;
	width: 0;
	height: 0;
	position: absolute;
`;

const RippleEffect = styled.span<{ $checked: boolean }>`
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

const SwitchContainer = styled.label<{ $checked: boolean }>`
	position: relative;
	display: inline-flex;
	align-items: center;
	cursor: pointer;
	-webkit-tap-highlight-color: transparent;

	@media (hover: hover) {
		&:hover ${RippleEffect} {
			background-color: ${({ $checked, theme }) =>
				$checked
					? c(theme).toggleHoverOn ?? 'rgba(72, 159, 181, 0.08)'
					: c(theme).toggleHoverOff ?? 'rgba(0, 0, 0, 0.04)'};
		}
	}

	&:focus-within ${RippleEffect} {
		background-color: ${({ $checked, theme }) =>
			$checked
				? c(theme).toggleFocusOn ?? 'rgba(72, 159, 181, 0.12)'
				: c(theme).toggleFocusOff ?? 'rgba(0, 0, 0, 0.06)'};
	}
`;

const SwitchTrack = styled.span<{ $checked: boolean }>`
	width: 34px;
	height: 14px;
	background-color: ${({ $checked, theme }) =>
		$checked
			? c(theme).toggleTrackOn ?? 'rgba(72, 159, 181, 0.5)'
			: c(theme).toggleTrackOff ?? 'rgba(0, 0, 0, 0.38)'};
	border-radius: 7px;
	transition: background-color 150ms cubic-bezier(0.4, 0, 0.2, 1);
`;

const SwitchThumb = styled.span<{ $checked: boolean }>`
	position: absolute;
	top: 50%;
	left: ${({ $checked }) => ($checked ? '14px' : '0px')};
	transform: translateY(-50%) scale(${({ $checked }) => ($checked ? 1.1 : 1)});
	width: 20px;
	height: 20px;
	background-color: ${({ $checked, theme }) =>
		$checked
			? c(theme).toggleThumbOn ?? '#489fb5'
			: c(theme).toggleThumbOff ?? '#fafafa'};
	border-radius: 50%;
	box-shadow: 0px 2px 1px -1px ${({ theme }) => c(theme).shadowLight ?? 'rgba(0, 0, 0, 0.2)'},
		0px 1px 1px 0px ${({ theme }) => c(theme).shadowLighter ?? 'rgba(0, 0, 0, 0.14)'},
		0px 1px 3px 0px ${({ theme }) => c(theme).shadowLighter ?? 'rgba(0, 0, 0, 0.12)'};
	transition: left 400ms cubic-bezier(0.34, 1.56, 0.64, 1),
		transform 400ms cubic-bezier(0.34, 1.56, 0.64, 1),
		background-color 150ms cubic-bezier(0.4, 0, 0.2, 1);
	pointer-events: none;
`;

export type ToggleSwitchProps = {
	/** Controlled checked state. When provided, the component is controlled. */
	checked?: boolean;
	/** Initial checked state for the uncontrolled case. Defaults to `false`. */
	defaultChecked?: boolean;
	/** Fired with the next checked value whenever the switch is toggled. */
	onChange?: (checked: boolean) => void;
	/** When `true`, the switch is non-interactive and suppresses `onChange`. */
	disabled?: boolean;
};

export const ToggleSwitch = ({
	checked: controlledChecked,
	defaultChecked = false,
	onChange,
	disabled = false,
}: ToggleSwitchProps): ReactElement => {
	const [internalChecked, setInternalChecked] = useState(defaultChecked);

	const isControlled = controlledChecked !== undefined;
	const checked = isControlled ? controlledChecked : internalChecked;

	const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
		if (disabled) return;

		// Blur immediately to remove the focus highlight.
		e.target.blur();

		const newValue = !checked;
		if (!isControlled) {
			setInternalChecked(newValue);
		}
		onChange?.(newValue);
	};

	return (
		<SwitchContainer $checked={checked} onClick={(e) => e.stopPropagation()}>
			<SwitchInput
				type="checkbox"
				checked={checked}
				onChange={handleChange}
				disabled={disabled}
			/>
			<SwitchTrack $checked={checked} />
			<RippleEffect $checked={checked} />
			<SwitchThumb $checked={checked} />
		</SwitchContainer>
	);
};

export default ToggleSwitch;
