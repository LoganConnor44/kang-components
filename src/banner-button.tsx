/**
 * BannerButton — a pill-shaped call-to-action button with a leading icon and
 * cross-fading multilingual label.
 *
 * Ported from ymy-components (`./buttons/BannerButton`). The visual language is
 * preserved (rounded pill, drop shadow, primary/secondary variants, a press
 * "scale-down" feedback) but reconciled onto kang's conventions:
 *
 * - **Theme-driven colors** read off styled-components' `props.theme` (the same
 *   tokens {@link buildTheme} produces), with literal fallbacks so the button
 *   still renders without a `ThemeProvider`.
 * - **Press feedback** uses kang's CSS-first {@link pressPrimary} primitive
 *   instead of a bespoke keyframe, keeping the press language consistent across
 *   the library.
 * - **Label** delegates to kang's domain-free {@link AnimatedText}: the
 *   multilingual `buttonText` is mapped to `variants` (english ↔ preferred
 *   Chinese set) with all three strings reserved as sizers so the box never
 *   reflows mid-swap.
 *
 * Icons: ymy hard-depended on `react-icons` (FaPlus / FiSend). To keep kang
 * dependency-light and domain-free, the same two glyphs ship as inline SVGs
 * selectable via `iconComponent`, and consumers may pass any node via `icon`.
 *
 * `styled-components` and `react` are optional peer dependencies, pulled in only
 * by this (and other runtime) modules.
 */

import { type ReactNode } from 'react';
// Named imports (not the default) so this resolves consistently across bundler
// and raw ESM/CJS environments — see the note in ripple.ts.
import { styled } from 'styled-components';
import AnimatedText from './animated-text.js';
import { pressPrimary } from './press.js';
import type { CharacterPreference, DynamicLanguage } from './language.js';

export type BannerButtonProps = {
	/**
	 * Which built-in icon to display. `'plus'` and `'send'` ship as inline SVGs.
	 * Ignored when an explicit `icon` node is provided.
	 */
	iconComponent?: 'plus' | 'send';
	/**
	 * An explicit icon node, overriding `iconComponent`. Lets consumers supply
	 * their own glyph (e.g. a react-icons element) without kang depending on an
	 * icon library.
	 */
	icon?: ReactNode;
	/** The button label, available in english / traditional / simplified. */
	buttonText: DynamicLanguage;
	/** Visual variant. Defaults to `'primary'`. */
	buttonType?: 'primary' | 'secondary';
	/** Click handler. */
	onClick?: () => void;
	/** Preferred Chinese character set for the label. Defaults to `'simplified'`. */
	characterPreference?: CharacterPreference;
	/** Whether the label cross-fades between english and Chinese. Defaults to true. */
	animate?: boolean;
};

const BannerButtonContainer = styled.div`
	display: inline-block;
	position: relative;
	overflow: hidden;
	border-radius: 2.5rem;
	background: ${({ theme }) =>
		(theme as { colors?: { primary?: string } })?.colors?.primary ?? '#489fb5'};
	box-shadow: 0px 4px 4px 0px
		${({ theme }) =>
			(theme as { colors?: { shadow?: string } })?.colors?.shadow ?? 'rgba(0, 0, 0, 0.25)'};

	${pressPrimary()}
`;

const StyledButton = styled.button`
	display: flex;
	align-items: center;
	position: relative;
	z-index: 10;
	padding: 0.5rem 1rem;
	border: none;
	outline: none;
	cursor: pointer;
	transition: background-color 0.3s;

	&.primary {
		background-color: ${({ theme }) =>
			(theme as { colors?: { primary?: string } })?.colors?.primary ?? '#489fb5'};
		color: ${({ theme }) =>
			(theme as { colors?: { onPrimary?: string } })?.colors?.onPrimary ?? 'white'};
	}

	&.secondary {
		background-color: ${({ theme }) =>
			(theme as { colors?: { secondaryLight?: string } })?.colors?.secondaryLight ?? '#ffb652'};
		color: ${({ theme }) =>
			(theme as { colors?: { onSecondary?: string } })?.colors?.onSecondary ?? 'black'};
	}
`;

const IconContainer = styled.span`
	display: flex;
	margin-right: 1.25rem;

	@media (min-width: 640px) {
		margin-right: 0.25rem;
	}
`;

/** Inline FaPlus (react-icons/fa) — kept identical so the glyph is unchanged. */
const PlusIcon = () => (
	<svg
		stroke="currentColor"
		fill="currentColor"
		strokeWidth="0"
		viewBox="0 0 448 512"
		height="1em"
		width="1em"
		xmlns="http://www.w3.org/2000/svg"
		aria-hidden="true"
		focusable="false"
	>
		<path d="M416 208H272V64c0-17.67-14.33-32-32-32h-32c-17.67 0-32 14.33-32 32v144H32c-17.67 0-32 14.33-32 32v32c0 17.67 14.33 32 32 32h144v144c0 17.67 14.33 32 32 32h32c17.67 0 32-14.33 32-32V304h144c17.67 0 32-14.33 32-32v-32c0-17.67-14.33-32-32-32z" />
	</svg>
);

/** Inline FiSend (react-icons/fi) — kept identical so the glyph is unchanged. */
const SendIcon = () => (
	<svg
		stroke="currentColor"
		fill="none"
		strokeWidth="2"
		viewBox="0 0 24 24"
		strokeLinecap="round"
		strokeLinejoin="round"
		height="1em"
		width="1em"
		xmlns="http://www.w3.org/2000/svg"
		aria-hidden="true"
		focusable="false"
	>
		<line x1="22" y1="2" x2="11" y2="13" />
		<polygon points="22 2 15 22 11 13 2 9 22 2" />
	</svg>
);

function resolveIcon(icon: ReactNode, iconComponent?: 'plus' | 'send'): ReactNode {
	if (icon !== undefined) return icon;
	if (iconComponent === 'plus') return <PlusIcon />;
	if (iconComponent === 'send') return <SendIcon />;
	return null;
}

export default function BannerButton({
	iconComponent,
	icon,
	buttonText,
	buttonType = 'primary',
	onClick,
	characterPreference = 'simplified',
	animate = true,
}: BannerButtonProps) {
	const iconElement = resolveIcon(icon, iconComponent);

	// Map the multilingual label onto AnimatedText's domain-free variant model:
	// cycle english <-> the preferred Chinese set, static index 0 = english
	// (matching ymy's default). All three strings are reserved as sizers so the
	// box is always sized to the widest and never reflows mid-swap.
	const chineseText =
		characterPreference === 'traditional' ? buttonText.traditional : buttonText.simplified;

	return (
		<BannerButtonContainer onClick={onClick}>
			<StyledButton type="button" className={buttonType}>
				{iconElement !== null && <IconContainer>{iconElement}</IconContainer>}
				<AnimatedText
					textStyles={{ lineHeight: '0.8rem', minWidth: '3rem' }}
					variants={[buttonText.english, chineseText]}
					sizers={[buttonText.english, buttonText.simplified, buttonText.traditional]}
					staticIndex={0}
					animate={animate}
				/>
			</StyledButton>
		</BannerButtonContainer>
	);
}
