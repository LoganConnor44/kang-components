/**
 * Action-sheet layout primitives — CSS-first, domain-free.
 *
 * The shared shape of a bottom-sheet "actions" panel: a vertical container, a
 * list, and tappable action rows with subtle press feedback. Each helper
 * returns a plain CSS string to interpolate into your styling layer.
 *
 *   const Container = styled.div`${actionSheetContainer()}`;
 *   const List = styled.div`${actionSheetList()}`;
 *   const Row = styled.button`${actionSheetRow(theme.colors.surfaceVariant)}`;
 *
 * Colors stay with the consumer: `actionSheetRow` takes the pressed-state
 * background so Kang carries no theme knowledge. Per-row content styling (icon
 * tint, destructive text, etc.) is the consumer's to layer on.
 */

import { pressSubtle } from './press.js';

/** Vertical action-sheet wrapper: column flex with standard sheet padding. */
export const actionSheetContainer = (): string => `
	display: flex;
	flex-direction: column;
	gap: 1rem;
	padding: 0.5rem 0;
`;

/** The list of action rows. */
export const actionSheetList = (): string => `
	display: flex;
	flex-direction: column;
`;

/**
 * A single tappable action row: leading-icon + label layout with subtle press
 * feedback (`pressSubtle`, with a background-color transition). Pass
 * `activeBackground` to tint the pressed state; omit it to leave the pressed
 * background to the consumer.
 */
export const actionSheetRow = (activeBackground?: string): string => `
	position: relative;
	display: flex;
	align-items: center;
	gap: 1rem;
	padding: 1rem;
	background: none;
	border: none;
	border-radius: 0.75rem;
	cursor: pointer;
	overflow: hidden;
	${pressSubtle('background-color 0.15s ease-out')}
	-webkit-tap-highlight-color: transparent;
${activeBackground ? `
	&:active {
		background-color: ${activeBackground};
	}` : ''}
`;
