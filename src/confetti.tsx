import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { tilePalette } from './tile-palette.js';
import { ConfettiLayer, ConfettiPiece } from './confetti.styles.js';

/** Airy pastel fills for the shape pieces — the shared word-tile palette. */
const SHAPE_COLORS = tilePalette.map((color) => color.bg);

/** Saturated tones for text pieces so glyphs stay legible on light surfaces. */
const TEXT_COLORS = [
	'#1976D2', '#388E3C', '#8E24AA', '#F4511E',
	'#0097A7', '#F9A825', '#5E35B1', '#039BE5',
];

export interface ConfettiProps {
	/** When true, the burst plays once on mount. */
	active: boolean;
	/** Optional text tokens (characters / phonics) sprinkled among the shapes. */
	tokens?: string[];
	/** Total number of pieces. */
	count?: number;
	/** Approximate lifetime of the burst in ms. */
	durationMs?: number;
}

interface Piece {
	key: number;
	text: string | null;
	color: string;
	startX: number;
	/** px */
	drift: number;
	/** px (negative, above viewport) */
	start: number;
	/** px fall distance */
	dist: number;
	rot: number;
	delay: number;
	dur: number;
	size: number;
	round: boolean;
}

/**
 * Build one immutable burst of pieces. Travel is computed in PIXELS from the
 * current viewport (never vh/vw, which iOS recomputes when its address bar
 * collapses). Called once when a burst starts; the result is frozen for the
 * lifetime of that burst (see the component below).
 */
function buildPieces(tokens: string[] | undefined, count: number, durationMs: number): Piece[] {
	const toks = tokens?.filter(Boolean) ?? [];
	const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
	const vw = typeof window !== 'undefined' ? window.innerWidth : 400;
	return Array.from({ length: count }, (_, i): Piece => {
		// Roughly 55% text pieces when tokens are available.
		const useText = toks.length > 0 && i % 9 < 5;
		const text = useText ? toks[i % toks.length] : null;
		return {
			key: i,
			text,
			color: useText
				? TEXT_COLORS[i % TEXT_COLORS.length]
				: SHAPE_COLORS[i % SHAPE_COLORS.length],
			startX: 50 + (Math.random() * 44 - 22), // start near center, spread out
			start: -vh * 0.12, // above the viewport
			drift: (Math.random() * 2 - 1) * vw * 0.5, // px left/right
			dist: vh * (0.95 + Math.random() * 0.35), // px — comfortably past the bottom
			rot: (Math.random() * 6 - 3) * 360, // deg
			delay: Math.random() * 260, // ms
			dur: durationMs * (0.7 + Math.random() * 0.5),
			size: 7 + Math.random() * 8,
			round: Math.random() > 0.6,
		};
	});
}

/**
 * Lightweight, dependency-free celebratory confetti. Pieces are GPU-animated
 * via a single CSS keyframe; per-piece motion is randomized through inline CSS
 * custom properties (in pixels). Mix in text tokens to rain played
 * characters/phonics.
 *
 * Rendered through a portal to <body> as a viewport-fixed overlay so it lives
 * outside any fixed/overflow/contain subtree — that nesting was freezing the
 * fall mid-viewport on iOS Safari.
 *
 * The burst is computed ONCE when it starts (active false→true) and frozen for
 * its lifetime. Incidental re-renders must not re-roll the pieces: callers may
 * derive `tokens` from objects whose identity churns (e.g. GunJS emits).
 * Recomputing mid-fall would change each piece's animation target
 * (--start/--dx/--dist/duration) while the keyframe is in flight, which
 * stalls/jumps the pieces mid-viewport on iOS.
 */
export function Confetti({ active, tokens, count = 64, durationMs = 2600 }: ConfettiProps) {
	const [pieces, setPieces] = useState<Piece[]>([]);
	const [visible, setVisible] = useState(false);

	// Latest tokens, read only at burst start so token-identity churn during a
	// burst never reaches buildPieces.
	const tokensRef = useRef(tokens);
	tokensRef.current = tokens;

	useEffect(() => {
		if (!active) {
			setVisible(false);
			return;
		}
		setPieces(buildPieces(tokensRef.current, count, durationMs));
		setVisible(true);
		const longest = durationMs * 1.2 + 300;
		const t = setTimeout(() => setVisible(false), longest);
		return () => clearTimeout(t);
	}, [active, count, durationMs]);

	if (!visible || typeof document === 'undefined') return null;

	const layer = (
		<ConfettiLayer aria-hidden="true">
			{pieces.map((p) => {
				const base: CSSProperties = {
					left: `${p.startX}%`,
					animationDelay: `${p.delay}ms`,
					animationDuration: `${p.dur}ms`,
					['--start' as string]: `${p.start}px`,
					['--dx' as string]: `${p.drift}px`,
					['--dist' as string]: `${p.dist}px`,
					['--rot' as string]: `${p.rot}deg`,
				};
				const visual: CSSProperties = p.text
					? {
						color: p.color,
						fontSize: `${p.size + 8}px`,
						fontWeight: 800,
						lineHeight: 1,
					}
					: {
						background: p.color,
						width: `${p.size}px`,
						height: `${p.size * 1.4}px`,
						borderRadius: p.round ? '50%' : '2px',
					};
				return (
					<ConfettiPiece key={p.key} style={{ ...base, ...visual }}>
						{p.text}
					</ConfettiPiece>
				);
			})}
		</ConfettiLayer>
	);

	return createPortal(layer, document.body);
}
