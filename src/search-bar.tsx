/**
 * SearchBar — a *composite*: a back button + the expanding {@link SearchField} +
 * a slide-in reveal, wired together with their animation as one unit. This is
 * the next tier above kang's primitives — a group of components that must work
 * together — so apps (xunzi's native search, the Hua Wen Reader add-on) mount
 * the same animated search bar rather than re-implementing it.
 *
 * Presentational + domain-free: the host controls `active` (drives the reveal),
 * owns the `value`/`onChange`, and supplies an optional `onBack`. Positioning
 * (e.g. over a shell/backstage) and any decoration (titles, watermarks) stay
 * with the host, which can wrap this or pass a `title` slot.
 *
 * Composes kang's own `BackButton` + `SearchField`; `styled-components`, `react`
 * and `@react-spring/web` are the only things it pulls in.
 */

import { useEffect, type ReactElement, type ReactNode } from 'react';
import { styled } from 'styled-components';
import { animated, useSpring } from '@react-spring/web';
import BackButton from './back-button.js';
import { SearchField } from './search-field.js';

export interface SearchBarProps {
	/** Drives the slide-in/out reveal (and whether the field is interactive). */
	active: boolean;
	value: string;
	onChange: (value: string) => void;
	/** Optional back/close button rendered before the field. */
	onBack?: () => void;
	backAriaLabel?: string;
	placeholder?: string;
	ariaLabel?: string;
	/** Optional leading title/label rendered above the field row. */
	title?: ReactNode;
	className?: string;
}

const Reveal = styled(animated.div)`
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
	will-change: transform, opacity;
`;

const Row = styled.div`
	display: flex;
	align-items: center;
	gap: 0.5rem;
`;

/** Lets the (explicitly-width-animated) SearchField fill the row beside the back button. */
const FieldWrap = styled.div`
	flex: 1 1 auto;
	min-width: 0;
`;

export function SearchBar({
	active,
	value,
	onChange,
	onBack,
	backAriaLabel = 'Back',
	placeholder,
	ariaLabel,
	title,
	className,
}: SearchBarProps): ReactElement {
	const [reveal, revealApi] = useSpring(() => ({
		y: -16,
		opacity: 0,
		display: 'none' as 'none' | 'flex',
	}));

	useEffect(() => {
		const config = { tension: 300, friction: 30 };
		if (active) {
			revealApi.start({ y: 0, opacity: 1, display: 'flex', config });
		} else {
			revealApi.start({
				y: -16,
				opacity: 0,
				config,
				onRest: () => revealApi.set({ display: 'none' }),
			});
		}
	}, [active, revealApi]);

	return (
		<Reveal
			className={className}
			style={{
				opacity: reveal.opacity,
				display: reveal.display,
				transform: reveal.y.to((v) => `translateY(${v}px)`),
			}}
		>
			{title}
			<Row>
				{onBack && <BackButton onClick={onBack} ariaLabel={backAriaLabel} />}
				<FieldWrap>
					{/* Re-key on each open so the expand-from-circle animation replays. */}
					<SearchField
						key={active ? 'open' : 'closed'}
						value={value}
						onChange={onChange}
						placeholder={placeholder}
						ariaLabel={ariaLabel}
						autoExpand={active}
					/>
				</FieldWrap>
			</Row>
		</Reveal>
	);
}

export default SearchBar;
