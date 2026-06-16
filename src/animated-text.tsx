/**
 * AnimatedText — a domain-free cross-fading text cycler.
 *
 * Shows one of several string `variants`, periodically cross-fading to the next
 * (a swap at the opacity-0 midpoint via react-spring's `onRest`). With two
 * variants it simply toggles back and forth; with more it rotates in order.
 *
 * Domain-free: it knows nothing about languages, characters, or app state. The
 * consumer decides what the variants are (e.g. an i18n layer maps its own
 * language model down to `variants` + `staticIndex`). This keeps the multilingual
 * knowledge in the app and the motion mechanics here.
 *
 * Layout never reflows during a swap: every candidate string is also rendered as
 * a hidden sizer span stacked in the same grid cell, so the box is always sized
 * to the widest candidate. Pass `sizers` when the set of strings that must fit is
 * wider than the visible `variants` (e.g. the variants you cycle are a subset of
 * all possible values).
 *
 * react-spring is used deliberately (not CSS): the text swap must happen exactly
 * at the fade's midpoint, which needs `onRest`. This matches the project's
 * CSS-first animation policy, which routes "animations requiring onRest" to
 * react-spring. `@react-spring/web` and `react` are optional peer dependencies —
 * only this module pulls them in.
 */

import { createElement, CSSProperties, useEffect, useRef, useState } from 'react';
import { animated, useSpring } from '@react-spring/web';

export type AnimatedTextProps = {
	/** Strings to cross-fade between, in order. Two → toggle; more → rotate. */
	variants: string[];
	/** Cycle through variants (true) or hold a single static variant (false). Default true. */
	animate?: boolean;
	/** Which variant to show when `animate` is false. Default 0. */
	staticIndex?: number;
	/**
	 * Strings reserved (rendered hidden) purely to size the box so it never
	 * reflows mid-swap. Defaults to `variants`. Provide a wider set when the
	 * cycled variants are a subset of all possible values.
	 */
	sizers?: string[];
	/** Start at opacity 0 and fade in on mount. */
	fadeIn?: boolean;
	/** Maximum ms between cross-fade cycles (the minimum is 3500). Default 15000. */
	maxDelay?: number;
	/** Element to render the text grid as. Default 'div'. */
	htmlElement?: keyof JSX.IntrinsicElements;
	/** Styles for the text; font-related props are applied to every (visible + sizer) span. */
	textStyles?: CSSProperties;
};

const MIN_DELAY = 3500;
const FIRST_CYCLE_DELAY = 500;

export default function AnimatedText({
	variants,
	animate = true,
	staticIndex = 0,
	sizers,
	fadeIn = false,
	maxDelay = 15000,
	htmlElement = 'div',
	textStyles,
}: AnimatedTextProps) {
	const [cycle, setCycle] = useState(0);
	const [spring, springApi] = useSpring(() => ({
		opacity: fadeIn ? 0 : 1,
		config: { duration: 600 },
	}));
	const wasAnimating = useRef(animate);

	useEffect(() => {
		if (!animate) {
			wasAnimating.current = animate;
			return;
		}
		const justActivated = !wasAnimating.current && animate;
		wasAnimating.current = animate;
		const delay = justActivated
			? FIRST_CYCLE_DELAY
			: Math.floor(Math.random() * (maxDelay - MIN_DELAY + 1)) + MIN_DELAY;
		const timer = setTimeout(() => {
			springApi.start({
				opacity: 0,
				onRest: () => {
					setCycle((c) => c + 1);
					springApi.start({ opacity: 1 });
				},
			});
		}, delay);
		return () => clearTimeout(timer);
	}, [cycle, animate, springApi, maxDelay]);

	const count = variants.length || 1;
	const visibleText = animate
		? variants[cycle % count]
		: variants[staticIndex] ?? variants[0];

	const { fontSize, fontFamily, fontWeight, fontStyle, letterSpacing, lineHeight, ...rest } =
		textStyles || {};
	const fontStyles = { fontSize, fontFamily, fontWeight, fontStyle, letterSpacing, lineHeight };
	const gridStyle: CSSProperties = { ...rest, display: 'inline-grid', alignContent: 'center' };
	const visibleStyle: CSSProperties = { ...fontStyles, gridArea: '1 / 1' };
	const hiddenStyle: CSSProperties = { ...fontStyles, gridArea: '1 / 1', visibility: 'hidden' };

	const sizerStrings = sizers ?? variants;

	return (
		<animated.div style={{ ...spring, display: 'inline-block' }}>
			{createElement(
				htmlElement,
				{ style: gridStyle },
				createElement('span', { style: visibleStyle, key: 'visible' }, visibleText),
				...sizerStrings.map((s, i) =>
					createElement('span', { style: hiddenStyle, key: `sizer-${i}`, 'aria-hidden': true }, s)
				)
			)}
		</animated.div>
	);
}
