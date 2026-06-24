/**
 * BackButton — a domain-free "go back" control.
 *
 * Ported from ymy-components (`./buttons/BackButton`), where it was a bare
 * `<IoChevronBackOutline onClick={...} />` with no semantics, no press feedback
 * and no theming. The kang port keeps the same public surface (`size`, `onClick`)
 * but upgrades it into a real, accessible control following kang conventions:
 *
 * - Renders a semantic `<button type="button">` (was a bare SVG with a click
 *   handler) so it is keyboard-focusable and announced as a button.
 * - Press feedback via the shared `pressPrimary()` CSS primitive — the same
 *   scale/bounce language every kang action button uses.
 * - A Material `Ripple` overlay on press, themed off `theme.colors.ripple`.
 * - Icon color reads `theme.colors.onSurface` (falls back to `currentColor`),
 *   so it adapts to a styled-components `ThemeProvider` but still works without
 *   one.
 * - `disabled` support: blocks the click and dims the control.
 *
 * `styled-components`, `react` and `react-icons` are the only things this module
 * pulls in; consumers importing the press/string primitives never touch them.
 */

import { useCallback, type MouseEvent, type ReactElement } from 'react';
import { styled } from 'styled-components';
import { IoChevronBackOutline } from 'react-icons/io5';
import { pressPrimary } from './press.js';
import { Ripple, useRipple } from './ripple.js';

export type BackButtonProps = {
	/** Icon size (any CSS size value). Defaults to `'1.5rem'` — matching ymy. */
	size?: string;
	/**
	 * Optional click handler, invoked on click/activation. If omitted the button
	 * is inert (renders, but does nothing on press).
	 */
	onClick?: () => void;
	/** Disable the control: blocks the handler and dims the icon. */
	disabled?: boolean;
	/** Accessible label for screen readers. Defaults to `'Back'`. */
	ariaLabel?: string;
	/** Optional class name passthrough for layout/positioning by the consumer. */
	className?: string;
};

const StyledBackButton = styled.button<{ $disabled: boolean }>`
	position: relative;
	overflow: hidden;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	padding: 0;
	margin: 0;
	border: none;
	background: transparent;
	cursor: ${({ $disabled }) => ($disabled ? 'not-allowed' : 'pointer')};
	color: ${({ theme }) =>
		(theme as { colors?: { onSurface?: string } })?.colors?.onSurface ?? 'currentColor'};
	opacity: ${({ $disabled }) => ($disabled ? 0.4 : 1)};
	line-height: 0;
	-webkit-tap-highlight-color: transparent;

	${pressPrimary()}

	&:disabled {
		pointer-events: none;
	}
`;

const BackButton = ({
	size,
	onClick,
	disabled = false,
	ariaLabel = 'Back',
	className,
}: BackButtonProps): ReactElement => {
	const { ripple, trigger, isTarget } = useRipple<'back'>();

	const handleClick = useCallback(
		(e: MouseEvent<HTMLButtonElement>) => {
			if (disabled) return;
			trigger(e, 'back');
			onClick?.();
		},
		[disabled, onClick, trigger]
	);

	return (
		<StyledBackButton
			type="button"
			className={className}
			$disabled={disabled}
			disabled={disabled}
			aria-label={ariaLabel}
			onClick={handleClick}
		>
			<IoChevronBackOutline size={size != null ? size : '1.5rem'} aria-hidden="true" />
			{isTarget('back') && ripple && <Ripple key={ripple.key} $x={ripple.x} $y={ripple.y} />}
		</StyledBackButton>
	);
};

export default BackButton;
