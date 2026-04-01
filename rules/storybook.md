---
name: Storybook Standards
description: Storybook story conventions for Incyclist Mobile.
---

# Storybook Rules

## Package
The project uses `@storybook/react-native-web-vite`. Do not import from
`@storybook/react`, `@storybook/react-native`, or any other renderer package.

## Imports — copy these exactly, no variations permitted
```typescript
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';
```

## Story target
- Stories always target the **View** component (`FooView.tsx`), never the smart component (`Foo.tsx`)
- For pure components with no smart/view split, target the component directly

## Event handlers
All callback props must be wired as Storybook actions using `fn()` from `'storybook/test'`.
Never use `jest.fn()` — `jest` is not available in the Storybook/Vite browser context and will cause a `ReferenceError` at runtime.
```typescript
const meta: Meta<typeof FooView> = {
    component: FooView,
    args: {
        onPress: fn(),
        onClose: fn(),
    },
};
```

## No Jest APIs in story files
Never use any of the following in a story file — they are Jest-only and will crash Storybook:
- `jest.mock()`
- `jest.fn()`
- `jest.spyOn()`
- `fireEvent` (from `@testing-library`)
- `findByTestId`

If a View component renders smart sub-components (e.g. dialogs that call services), those sub-components must be replaced with lightweight placeholders via render props. The View component must expose optional render props with defaults for each smart sub-component it hosts. Stories pass inline placeholder JSX for those props — no module mocking needed.

## Native module mocks
Native modules that crash the Vite renderer (SVG, MMKV, MapLibre, react-native-maps, react-native-video, etc.) must be mocked in two places — both are required or Storybook will not load:
1. A mock file in `.storybook/mocks/<module-name>.tsx`
2. An alias entry in `.storybook/main.ts` under `resolve.alias`

## Story naming
Use PascalCase for all story export names (`Default`, `Compact`, `WithError`).
Never use camelCase (`defaultArgs`, `withError`).

## Story title
Always set an explicit `title` in the `meta` object. Never rely on Storybook auto-generation.
Use the following conventions:
- Components: `'Components/<ComponentName>'`
- Pages: `'Pages/<PageName>'`

## One story file per component
`ComponentName.stories.tsx` lives in the same folder as the component.
