/**
 * ListItem + UnorderedListItemContainer — a pressable settings/menu row and its
 * list wrapper.
 *
 * Ported from ymy-components (`./collections/ListItem` + `./collections/
 * ListItem.styles`), preserving the exact public API the xunzi call sites
 * (`AuthSection`, `Profile`) drive, so re-pointing them at kang is a pure import
 * swap. A row renders a leading icon, a label, and a trailing action (a chevron,
 * or an inline Material toggle when `actionIcon === 'switch'`), with a Material
 * ripple on press.
 *
 * kang-specific upgrades / adaptations:
 * - **Press feedback** uses kang's shared `Ripple` / `useRipple` primitives
 *   (themed off `theme.colors.ripple`), replacing ymy's bespoke ripple wiring.
 * - **Icons:** ymy hard-depended on `react-icons` (MdTranslate / MdOutlineWbSunny
 *   / MdChevronRight). To keep kang dependency-light and domain-free, the same
 *   glyphs ship as inline SVGs (identical Material-icons path data), selectable
 *   via the `icon` string. Consumers may override the leading glyph with any node
 *   via `iconNode` — the same override pattern as BackButton / CircleIconButton.
 * - **Text:** the `textContent` path maps the app's `DynamicLanguage` model onto
 *   kang's domain-free `AnimatedText` (`variants` / `staticIndex` / `sizers`),
 *   exactly as xunzi's AnimatedText adapter does — so language knowledge stays in
 *   the shared language types and the motion stays in `AnimatedText`.
 * - **Toggle:** ymy rendered a separate `ToggleSwitch`; that Material toggle is
 *   inlined (controlled or uncontrolled) so kang needn't ship a ToggleSwitch yet.
 *
 * `styled-components`, `@react-spring/web` (via AnimatedText) and `react` are the
 * only things this module pulls in, all optional peer deps.
 */

import {
	useState,
	type ChangeEvent,
	type CSSProperties,
	type MouseEvent,
	type ReactElement,
	type ReactNode,
} from 'react';
import AnimatedText from './animated-text.js';
import { Ripple, useRipple } from './ripple.js';
import type {
	CharacterPreference,
	DynamicLanguage,
	StaticLanguage,
} from './language.js';
import {
	ListItemContainer,
	ListItemContent,
	ListItemIcon,
	ListItemLeftContent,
	ListItemText,
	SwitchContainer,
	SwitchInput,
	SwitchRipple,
	SwitchThumb,
	SwitchTrack,
} from './list-item.styles.js';

/** The built-in leading icons a row can render (was ymy's `PrimaryIcons`). */
export type ListItemIconName = 'translate' | 'sunny' | 'character';
/** The built-in trailing actions a row can render (was ymy's `SecondaryIconName`). */
export type ListItemActionName = 'chevron' | 'switch';

/** Inline MdTranslate (react-icons/md) — Material-icons path data, glyph unchanged. */
const TranslateIcon = ({ size }: { size: string }): ReactElement => (
	<svg
		stroke="currentColor"
		fill="currentColor"
		strokeWidth="0"
		viewBox="0 0 24 24"
		height={size}
		width={size}
		xmlns="http://www.w3.org/2000/svg"
		aria-hidden="true"
		focusable="false"
	>
		<path fill="none" d="M0 0h24v24H0z" />
		<path d="m12.87 15.07-2.54-2.51.03-.03A17.52 17.52 0 0 0 14.07 6H17V4h-7V2H8v2H1v1.99h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7 1.62-4.33L19.12 17h-3.24z" />
	</svg>
);

/** Inline MdOutlineWbSunny (react-icons/md) — Material-icons path data, glyph unchanged. */
const SunnyIcon = ({ size }: { size: string }): ReactElement => (
	<svg
		stroke="currentColor"
		fill="currentColor"
		strokeWidth="0"
		viewBox="0 0 24 24"
		height={size}
		width={size}
		xmlns="http://www.w3.org/2000/svg"
		aria-hidden="true"
		focusable="false"
	>
		<path fill="none" d="M0 0h24v24H0V0z" />
		<path d="m6.76 4.84-1.8-1.79-1.41 1.41 1.79 1.79zM1 10.5h3v2H1zM11 .55h2V3.5h-2zm8.04 2.495 1.408 1.407-1.79 1.79-1.407-1.408zm-1.8 15.115 1.79 1.8 1.41-1.41-1.8-1.79zM20 10.5h3v2h-3zm-8-5c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm-1 4h2v2.95h-2zm-7.45-.96 1.41 1.41 1.79-1.8-1.41-1.41z" />
	</svg>
);

/**
 * The "character" glyph: the literal Chinese character 字, rendered as text
 * (ymy did the same — not an SVG icon).
 */
const CharacterIcon = ({ size }: { size: string }): ReactElement => (
	<span
		style={{
			fontSize: size,
			height: size,
			lineHeight: size,
			display: 'inline-flex',
			alignItems: 'center',
		}}
	>
		字
	</span>
);

/** Inline MdChevronRight (react-icons/md) — Material-icons path data, glyph unchanged. */
const ChevronRightIcon = (): ReactElement => (
	<svg
		stroke="currentColor"
		fill="currentColor"
		strokeWidth="0"
		viewBox="0 0 24 24"
		height="1em"
		width="1em"
		xmlns="http://www.w3.org/2000/svg"
		aria-hidden="true"
		focusable="false"
	>
		<path fill="none" d="M0 0h24v24H0z" />
		<path d="M10 6 8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
	</svg>
);

const LEADING_ICONS: Record<
	ListItemIconName,
	(props: { size: string }) => ReactElement
> = {
	translate: TranslateIcon,
	sunny: SunnyIcon,
	character: CharacterIcon,
};

export type ListItemProps = {
	/** Which built-in leading icon to render. Ignored when `iconNode` is provided. */
	icon: ListItemIconName;
	/**
	 * An explicit leading-icon node, overriding the built-in `icon`. Lets
	 * consumers supply their own glyph without kang depending on an icon library —
	 * the same override pattern as BackButton / CircleIconButton.
	 */
	iconNode?: ReactNode;
	/** Plain-text label (used when `textContent` is absent). */
	text?: string;
	/**
	 * Multilingual label. When present it renders kang's cross-fading
	 * {@link AnimatedText}, cycling english ⇄ chinese per `characterPreference`.
	 */
	textContent?: DynamicLanguage;
	/** Which character set (`simplified`/`traditional`) the chinese variant uses. */
	characterPreference?: CharacterPreference;
	/** Cross-fade the label (true) or hold a single static variant (false). Default true. */
	animate?: boolean;
	/** Max ms between cross-fade cycles, forwarded to AnimatedText. */
	maxDelay?: number;
	/** Trailing action: a chevron (default) or an inline toggle. */
	actionIcon?: ListItemActionName;
	/** Row click handler (used when `actionIcon !== 'switch'`). */
	onClick?: () => void;
	/** Inline style passthrough on the `<li>`. */
	styles?: CSSProperties;
	/** Toggle state when `actionIcon === 'switch'` (controlled). */
	switchChecked?: boolean;
	/** Fired with the next toggle value when `actionIcon === 'switch'`. */
	onSwitchChange?: (checked: boolean) => void;
	/** Which language to show when `animate` is false. Forwarded to AnimatedText. */
	staticLanguage?: StaticLanguage;
};

/**
 * Inline Material toggle (ymy's `ToggleSwitch`). Controlled when `checked` is
 * supplied, otherwise uncontrolled. Stops click propagation so toggling the
 * switch doesn't also fire the row's click.
 */
function InlineToggle({
	checked: controlledChecked,
	onChange,
}: {
	checked?: boolean;
	onChange?: (checked: boolean) => void;
}): ReactElement {
	const [internalChecked, setInternalChecked] = useState(false);
	const isControlled = controlledChecked !== undefined;
	const checked = isControlled ? controlledChecked : internalChecked;

	const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
		// Blur immediately to drop the focus highlight (matches ymy).
		e.target.blur();
		const next = !checked;
		if (!isControlled) setInternalChecked(next);
		onChange?.(next);
	};

	return (
		<SwitchContainer $checked={checked} onClick={(e) => e.stopPropagation()}>
			<SwitchInput type="checkbox" checked={checked} onChange={handleChange} />
			<SwitchTrack $checked={checked} />
			<SwitchRipple $checked={checked} />
			<SwitchThumb $checked={checked} />
		</SwitchContainer>
	);
}

export const ListItem = ({
	icon,
	iconNode,
	text,
	textContent,
	characterPreference,
	animate = true,
	maxDelay,
	actionIcon = 'chevron',
	onClick,
	styles,
	switchChecked,
	onSwitchChange,
	staticLanguage,
}: ListItemProps): ReactElement => {
	const { ripple, trigger, isTarget } = useRipple<'row'>();

	const handleRowClick = (e: MouseEvent<HTMLLIElement>) => {
		trigger(e, 'row');
		if (actionIcon === 'switch') {
			onSwitchChange?.(!switchChecked);
		} else {
			onClick?.();
		}
	};

	const LeadingIcon = LEADING_ICONS[icon];

	const renderTrailingAction = (): ReactElement =>
		actionIcon === 'switch' ? (
			<InlineToggle checked={switchChecked} onChange={onSwitchChange} />
		) : (
			<ChevronRightIcon />
		);

	// Map the app's DynamicLanguage onto kang's domain-free AnimatedText, exactly
	// as xunzi's AnimatedText adapter does, so output is identical to ymy.
	let labelNode: ReactNode = text;
	if (textContent) {
		const charPref = characterPreference ?? 'simplified';
		const chinese =
			charPref === 'traditional' ? textContent.traditional : textContent.simplified;
		labelNode = (
			<AnimatedText
				variants={[textContent.english, chinese]}
				animate={animate}
				staticIndex={staticLanguage === 'chinese' ? 1 : 0}
				sizers={[
					textContent.english,
					textContent.simplified,
					textContent.traditional,
				]}
				maxDelay={maxDelay}
			/>
		);
	}

	return (
		<ListItemContainer onClick={handleRowClick} style={styles}>
			{isTarget('row') && ripple && (
				<Ripple key={ripple.key} $x={ripple.x} $y={ripple.y} />
			)}
			<ListItemContent>
				<ListItemLeftContent>
					<ListItemIcon>
						{iconNode !== undefined ? iconNode : <LeadingIcon size="1rem" />}
					</ListItemIcon>
					<ListItemText>{labelNode}</ListItemText>
				</ListItemLeftContent>
				<ListItemIcon>{renderTrailingAction()}</ListItemIcon>
			</ListItemContent>
		</ListItemContainer>
	);
};

export { UnorderedListItemContainer } from './list-item.styles.js';

export default ListItem;
