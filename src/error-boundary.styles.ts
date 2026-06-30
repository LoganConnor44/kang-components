// Named import (not the default) so styled-components resolves consistently
// when this file is consumed as a published node_modules ESM module.
import { styled } from 'styled-components';

// This fallback renders ABOVE the app's ThemeProvider, so it cannot read the
// styled-components theme. Colors are hard-coded and follow the OS color scheme
// directly (matching a white light / black dark theme-color).

export const ErrorBoundaryContainer = styled.div`
	position: fixed;
	inset: 0;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 24px;
	box-sizing: border-box;
	background: #ffffff;
	color: #1a202c;
	font-family:
		-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;

	@media (prefers-color-scheme: dark) {
		background: #000000;
		color: #f7fafc;
	}
`;

export const ErrorCard = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 16px;
	width: 100%;
	max-width: 360px;
	text-align: center;
`;

export const ErrorTitle = styled.h1`
	margin: 0;
	font-size: 1.375rem;
	font-weight: 600;
`;

export const ErrorMessage = styled.p`
	margin: 0;
	font-size: 0.95rem;
	line-height: 1.5;
	opacity: 0.75;
`;

export const ReloadButton = styled.button`
	margin-top: 8px;
	padding: 12px 28px;
	font-size: 1rem;
	font-weight: 600;
	color: #ffffff;
	background: #4db6ac;
	border: none;
	border-radius: 9999px;
	cursor: pointer;
	transition: opacity 0.15s ease;

	&:hover {
		opacity: 0.9;
	}

	&:focus-visible {
		outline: 2px solid #4db6ac;
		outline-offset: 3px;
	}
`;
