/**
 * Press-feedback CSS primitives — the generic press language for Kang consumers.
 *
 * CSS-first: every helper returns a plain CSS string (no styled-components or
 * other CSS-in-JS dependency). Interpolate the result into whatever template
 * your styling layer uses, e.g. styled-components:
 *
 *   const Button = styled.button`
 *     ${pressPrimary()}
 *   `;
 *
 * Two tiers:
 * - pressPrimary (scale 0.95): discrete action buttons — CTAs, icon buttons,
 *   confirm/cancel buttons, nav controls.
 * - pressSubtle (scale 0.97): large tappable surfaces — tiles, cards, list
 *   rows, picker options, tabs.
 *
 * Physics: press down fast (60ms, ease-out); release with a bouncy spring-back
 * (300ms, cubic-bezier overshooting ~6%) — a rubber-band feel without JS spring
 * physics.
 *
 * Each helper owns the `transition` declaration in both rest and pressed
 * states. If the element transitions other properties (background, color,
 * opacity...), pass them via `extraTransition` instead of declaring a second
 * `transition` — a separate declaration would override this one.
 *
 * The *Scale variants animate the CSS `scale` property instead of `transform`,
 * for elements whose `transform` is already controlled elsewhere (e.g. a JS
 * spring).
 */

export const BOUNCE_CURVE = 'cubic-bezier(0.34, 1.56, 0.64, 1)';

export const PRESS_SCALE_PRIMARY = 0.95;
export const PRESS_SCALE_SUBTLE = 0.97;

const transitionFor = (property: string, duration: string, easing: string, extra?: string): string =>
	`transition: ${property} ${duration} ${easing}${extra ? `, ${extra}` : ''};`;

const springPress = (scaleValue: number, extraTransition?: string): string => `
	${transitionFor('transform', '0.3s', BOUNCE_CURVE, extraTransition)}
	will-change: transform;

	&:active {
		transform: scale(${scaleValue});
		${transitionFor('transform', '0.06s', 'ease-out', extraTransition)}
	}
`;

const springPressScale = (scaleValue: number, extraTransition?: string): string => `
	${transitionFor('scale', '0.3s', BOUNCE_CURVE, extraTransition)}

	&:active {
		scale: ${scaleValue};
		${transitionFor('scale', '0.06s', 'ease-out', extraTransition)}
	}
`;

/** Action buttons: CTAs, icon buttons, confirm/cancel. */
export const pressPrimary = (extraTransition?: string): string =>
	springPress(PRESS_SCALE_PRIMARY, extraTransition);

/** Tappable surfaces: tiles, cards, rows, tabs. */
export const pressSubtle = (extraTransition?: string): string =>
	springPress(PRESS_SCALE_SUBTLE, extraTransition);

/** pressPrimary for elements whose `transform` is controlled elsewhere (uses CSS `scale`). */
export const pressPrimaryScale = (extraTransition?: string): string =>
	springPressScale(PRESS_SCALE_PRIMARY, extraTransition);

/** pressSubtle for elements whose `transform` is controlled elsewhere (uses CSS `scale`). */
export const pressSubtleScale = (extraTransition?: string): string =>
	springPressScale(PRESS_SCALE_SUBTLE, extraTransition);
