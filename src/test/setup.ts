import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// jsdom does not implement PointerEvent, so React's synthetic pointer events
// carry none of the pointer fields (isPrimary, pointerType, button, clientX/Y)
// and pointer-gesture components can't be exercised. Polyfill a minimal one
// (extending MouseEvent for the coordinate/button fields) so fireEvent.pointer*
// propagates the init dict.
if (typeof globalThis.PointerEvent === 'undefined') {
	class PointerEventPolyfill extends MouseEvent {
		readonly pointerId: number;
		readonly pointerType: string;
		readonly isPrimary: boolean;
		constructor(type: string, params: PointerEventInit = {}) {
			super(type, params);
			this.pointerId = params.pointerId ?? 0;
			this.pointerType = params.pointerType ?? '';
			this.isPrimary = params.isPrimary ?? false;
		}
	}
	globalThis.PointerEvent = PointerEventPolyfill as unknown as typeof PointerEvent;
}

afterEach(() => {
	cleanup();
});
