# kang-components

Generic, domain-free React UI primitives. Built to be consumed by Xunzi (and
anything else) while it migrates off `ymy-components` — see the
[Xunzi straddle epic](https://github.com/LoganConnor44/xunzi/issues/294).

## Design constraints

- **No app domain knowledge.** No HSK, challenge, friend, route, or Redux
  concepts. Primitives only.
- **CSS-first.** Simple interaction primitives return plain CSS strings — no
  CSS-in-JS runtime dependency. Use JS animation only when it earns the cost.
- **Additive, non-breaking APIs** before each manual npm publication.

## Install

```bash
npm install kang-components
```

`react` is an optional peer dependency — only required if you use a hook
(e.g. `useAnimatedAction`). The press primitives are pure strings and need
nothing.

## Press primitives

CSS-first press feedback. Each helper returns a plain CSS string you interpolate
into your styling layer (styled-components shown):

```ts
import styled from 'styled-components';
import { pressPrimary, pressSubtle } from 'kang-components';

// Action buttons (scale 0.95)
const Button = styled.button`
	${pressPrimary()}
`;

// Large tappable surfaces (scale 0.97)
const Tile = styled.button`
	${pressSubtle()}
`;
```

When the element also transitions other properties, pass them via
`extraTransition` so they share the one `transition` declaration:

```ts
const Row = styled.button`
	${pressSubtle('background-color 0.15s ease-out')}
`;
```

For elements whose `transform` is driven elsewhere (e.g. a JS spring), use the
`*Scale` variants, which animate the CSS `scale` property instead:

```ts
import { pressPrimaryScale, pressSubtleScale } from 'kang-components';
```

Exports: `pressPrimary`, `pressSubtle`, `pressPrimaryScale`, `pressSubtleScale`,
plus the constants `BOUNCE_CURVE`, `PRESS_SCALE_PRIMARY`, `PRESS_SCALE_SUBTLE`.

## `useAnimatedAction`

Delays an action callback so visual feedback (ripple, press animation) is
perceived before the UI transitions away. Defaults to 180ms; clears pending
timeouts on unmount.

```ts
import { useAnimatedAction } from 'kang-components';

const act = useAnimatedAction();
const onClick = () => act(() => navigate('/next'));
```

## Build

```bash
npm run build   # tsc → dist (ESM + .d.ts)
```
