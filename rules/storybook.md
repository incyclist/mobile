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
All callback props must be wired as Storybook actions using `fn()`:
```typescript
const meta: Meta<typeof FooView> = {
    component: FooView,
    args: {
        onPress: fn(),
        onClose: fn(),
    },
};
```

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



