/**
 * Shared spring-animation configuration constants — the generic motion
 * vocabulary for Kang consumers.
 *
 * Domain-free and dependency-free: each constant is a plain
 * `{ tension, friction, mass? }` object. That shape is structurally
 * assignable to `@react-spring/web`'s `SpringConfig` (whose fields are all
 * optional), so a consumer can pass these straight into `useSpring`/`api.start`
 * `config:` without Kang taking a react-spring dependency.
 *
 * These mirror the presets that previously lived in `ymy-components` so feel is
 * identical across apps. Use the named constant instead of an inline literal so
 * every animation shares one tuned set of physics.
 */

/** A react-spring-compatible spring physics config (mass defaults to 1 in react-spring). */
export interface SpringConfigConstant {
	tension: number;
	friction: number;
	mass?: number;
}

/** Base comfortable config — smooth, relaxed animations. */
export const SPRING_COMFORTABLE: SpringConfigConstant = { tension: 200, friction: 25 };

/** Slower comfortable variant for background/gradient transitions. */
export const SPRING_COMFORTABLE_SLOW: SpringConfigConstant = { tension: 150, friction: 25 };

/** Snappy config — quick, responsive animations. */
export const SPRING_SNAPPY: SpringConfigConstant = { tension: 325, friction: 30 };

/** Responsive config — for UI elements that need quick feedback. */
export const SPRING_RESPONSIVE: SpringConfigConstant = { tension: 300, friction: 30 };

/** Staggered/lagged config — for cascading animations. */
export const SPRING_STAGGERED: SpringConfigConstant = { tension: 750, friction: 30 };

/** Instant config — near-immediate transitions. */
export const SPRING_INSTANT: SpringConfigConstant = { tension: 900, friction: 30 };

/** Gentle config — subtle, unobtrusive animations. */
export const SPRING_GENTLE: SpringConfigConstant = { tension: 185, friction: 25 };

/** Very slow config — for delayed/transitional animations. */
export const SPRING_VERY_SLOW: SpringConfigConstant = { tension: 50, friction: 20 };

/** Landing config — for "settling" hero animations with slight overshoot. */
export const SPRING_LANDING: SpringConfigConstant = { tension: 280, friction: 22, mass: 1 };

/** Rising config — for reverse hero animations, smoother deceleration. */
export const SPRING_RISING: SpringConfigConstant = { tension: 220, friction: 26, mass: 1 };
