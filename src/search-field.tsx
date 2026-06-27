/**
 * SearchField — a domain-free, animated search input. A surface "pill" that
 * expands from an icon-only circle to a full-width field on mount, with a
 * primary-colored magnifier, a borderless input that fades in once expanded,
 * and a round clear (×) button that appears when there is text.
 *
 * Extracted as a shared primitive so xunzi's search banner, the Hua Wen Reader
 * surface, and future apps all render the same field. Theming follows kang
 * conventions: every color reads a `theme.colors.*` token with a literal
 * fallback, so it adapts to a `ThemeProvider` yet still renders without one.
 *
 * `styled-components`, `react`, and (for the expand animation) `@react-spring/web`
 * are the only things this module pulls in; react-spring is an optional peer.
 */

import { useEffect, useRef, useState, type ReactElement } from 'react';
import { styled } from 'styled-components';
import { animated, useSpring } from '@react-spring/web';

export interface SearchFieldProps {
	/** Current input value (controlled). */
	value: string;
	/** Called with the new value on input, and with `''` when cleared. */
	onChange: (value: string) => void;
	/** Placeholder shown in the (expanded) field. */
	placeholder?: string;
	/** Accessible label for the input. */
	ariaLabel?: string;
	/** Play the expand-from-circle animation on mount (default: true). */
	autoExpand?: boolean;
	/** Class name passthrough for layout/positioning by the consumer. */
	className?: string;
}

type ThemeColors = { colors?: Record<string, string | undefined> };
const c =
	(token: string, fallback: string) =>
	({ theme }: { theme?: unknown }) =>
		(theme as ThemeColors)?.colors?.[token] ?? fallback;

const Pill = styled(animated.div)`
	display: flex;
	align-items: center;
	height: 2.75rem;
	min-height: 2.75rem;
	box-sizing: border-box;
	border-radius: 999px;
	background: ${c('surface', '#fdfcf8')};
	box-shadow: 0 2px 8px ${c('shadowSubtle', 'rgba(0, 0, 0, 0.08)')};
	overflow: hidden;
	will-change: width, padding, gap;
`;

const IconWrap = styled.span`
	display: flex;
	align-items: center;
	color: ${c('primary', '#4db6ac')};
	font-size: 1.25rem;
	flex-shrink: 0;
`;

const Field = styled(animated.input)`
	border: none;
	outline: none;
	background: transparent;
	font-size: 1rem;
	color: ${c('onSurface', '#333')};
	font-family: inherit;
	min-width: 0;

	&::placeholder {
		color: ${c('onSurface', '#333')};
		opacity: 0.4;
	}
`;

const Clear = styled(animated.button)`
	display: flex;
	align-items: center;
	justify-content: center;
	width: 1.5rem;
	height: 1.5rem;
	border: none;
	border-radius: 50%;
	background: ${c('outline', '#9e9e9e')};
	color: ${c('surface', '#fdfcf8')};
	cursor: pointer;
	padding: 0;
	flex-shrink: 0;
	opacity: 0.7;
	transition: opacity 0.2s ease;
	&:active {
		opacity: 1;
	}
`;

const SearchGlyph = (): ReactElement => (
	<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
		<circle cx="11" cy="11" r="7" />
		<line x1="16.5" y1="16.5" x2="21" y2="21" />
	</svg>
);

const CloseGlyph = (): ReactElement => (
	<svg viewBox="0 0 24 24" width="0.85em" height="0.85em" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
		<line x1="6" y1="6" x2="18" y2="18" />
		<line x1="18" y1="6" x2="6" y2="18" />
	</svg>
);

export function SearchField({
	value,
	onChange,
	placeholder,
	ariaLabel,
	autoExpand = true,
	className,
}: SearchFieldProps): ReactElement {
	const inputRef = useRef<HTMLInputElement>(null);
	const [expanded, setExpanded] = useState(false);
	const [field, fieldApi] = useSpring(() => ({ expand: 0 }));
	const [input, inputApi] = useSpring(() => ({ opacity: 0, y: 10 }));

	useEffect(() => {
		// Treat opt-out / reduced-motion / non-browser (test/SSR) envs as already
		// expanded so the field is immediately usable.
		const skip =
			!autoExpand ||
			typeof window === 'undefined' ||
			!window.matchMedia ||
			window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		if (skip) {
			fieldApi.set({ expand: 1 });
			inputApi.set({ opacity: 1, y: 0 });
			setExpanded(true);
			return;
		}
		const raf = requestAnimationFrame(() => {
			fieldApi.start({
				expand: 1,
				config: { tension: 220, friction: 24 },
				onRest: () => {
					setExpanded(true);
					inputApi.start({ opacity: 1, y: 0, config: { tension: 260, friction: 22 } });
				},
			});
		});
		return () => cancelAnimationFrame(raf);
	}, [autoExpand, fieldApi, inputApi]);

	return (
		<Pill
			className={className}
			style={{
				width: field.expand.to((v) => `calc(2.75rem + (100% - 2.75rem) * ${v})`),
				gap: field.expand.to((v) => `${0.5 * v}rem`),
				paddingLeft: '0.75rem',
				paddingRight: field.expand.to((v) => `${0.75 + 0.25 * v}rem`),
			}}
		>
			<IconWrap>
				<SearchGlyph />
			</IconWrap>
			<Field
				ref={inputRef}
				style={{
					opacity: input.opacity,
					transform: input.y.to((y) => `translateY(${y}px)`),
					flex: expanded ? '1 1 auto' : '0 0 0',
					width: expanded ? 'auto' : 0,
					pointerEvents: expanded ? 'auto' : 'none',
				}}
				type="text"
				inputMode="search"
				autoComplete="off"
				autoCorrect="off"
				autoCapitalize="off"
				spellCheck={false}
				placeholder={placeholder}
				value={value}
				onChange={(e) => onChange(e.target.value)}
				aria-label={ariaLabel}
			/>
			{value.length > 0 && (
				<Clear
					style={{ opacity: input.opacity, pointerEvents: expanded ? 'auto' : 'none' }}
					onClick={() => {
						onChange('');
						inputRef.current?.focus();
					}}
					aria-label="Clear search"
				>
					<CloseGlyph />
				</Clear>
			)}
		</Pill>
	);
}

export default SearchField;
