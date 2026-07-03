/**
 * focusVisibleRing — a shared keyboard focus indicator for kang's interactive
 * primitives.
 *
 * Many kang buttons set `outline: none` (or wrap a hidden input) and had **no**
 * replacement, so keyboard / switch-access users got no visible focus. This CSS
 * helper adds a ring that shows only for keyboard/AT focus (`:focus-visible`),
 * never on mouse press, so it doesn't disturb touch/mouse UX. It reads
 * `theme.colors.primary` (with a literal fallback) so it adapts to a
 * `ThemeProvider` yet still renders sensibly without one — matching the theming
 * convention of `press` / `ripple`.
 *
 * `styled-components` is an optional peer dependency, used only by this module.
 */
import { css } from 'styled-components';

type FocusTheme = { colors?: { primary?: string } };

/** Apply inside a styled interactive element. `offset` tunes the ring gap. */
export function focusVisibleRing(offset = '2px') {
	return css`
		&:focus-visible {
			outline: 2px solid
				${({ theme }) => (theme as FocusTheme)?.colors?.primary ?? '#489fb5'};
			outline-offset: ${offset};
		}
	`;
}
