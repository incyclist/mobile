---
name: React Native Standards
description: Enforces project-specific coding patterns and architecture.
---

# React Native Project Rules

Apply these rules to all code generation and refactoring tasks within this workspace.

## 1. Code Formatting
- **Indentation:** Always use exactly **4 spaces** for indentation. Never use tabs or 2-space indentation.
- **TypeScript:** Use TypeScript for all files. Define strict interfaces for `Props` and state objects at the top of each file.
- Use single quotes

## 2. Component Architecture
- **Functional Components:** Use functional components exclusively with the `const ComponentName = () => { ... }` syntax. Do not use class components.
- **Hooks:** Manage all lifecycle and local state using React Hooks (`useState`, `useEffect`, `useMemo`, etc.).
- **Styles:** Use `StyleSheet.create()` from `react-native`. Define the `styles` object at the very bottom of the file.
- **Component Content** Every component should have its own folder under src/components and should also be exported from src/components/index.ts. The folder should always contain:
  - index.ts : containing exports
  - types.ts : containing types
  - <ClassName>.tsx — the actual component
  - <ClassName>.stories.tsx — the Storybook story for this component
  - <SubComponent>.tsx — any local sub-component that will not be re-used by others
  - utils.ts — helper functions just used in this component
- **Page Components** Page components are special components as they represent a full page (screen) of the application. They should be stored in src/pages but otherwise the same rules apply as described for other components.

## 3. Business Logic (Incyclist Services)
- **Separation of Concerns:** Components must remain "thin" and focus only on UI/UX.
- **Logic Location:** Do NOT develop business logic, data transformations, or API calls inside this project.
- **Integration:** All business logic must be imported from the `incyclist-services` project. Reference or ask for methods from this service when implementing functionality.

## 4. Naming Conventions
- **Files/Components:** Use PascalCase (e.g., `UserProfile.tsx`).
- **Hooks/Variables:** Use camelCase (e.g., `useUserData`).

## 5. React Native Version
- The app is using React Native 0.83.1 or higher. Please consider this when giving instructions or selecting libraries.
- The native code is written in Kotlin (Android) and Swift (iOS).

## 6. React Hooks Rules
- **All hooks must be called before any conditional return.** `useState`, `useRef`, `useMemo`, `useEffect`, and `useCallback` must always appear before any `if (...) return null` or early return statement in the component body. Violating this causes a runtime crash.
- **No exceptions.** If an early return is needed based on computed data, compute the data in a hook first, then place the early return after all hooks have been called.

## 7. Smart / View Component Split
- **Smart components** own service subscriptions, local dialog state, and service method calls. They call `getXxxService()` or service hooks directly.
- **View components** are pure: they receive all data and callbacks via props. They must never import or call services directly.
- If a View component needs to render sub-components that are themselves smart (e.g. dialogs), use optional render props with defaults so the View remains pure and testable without service dependencies.

## 8. Files to Change
- **Only modify files listed in "Files to change" in the task.** Never modify any other file unless explicitly instructed.
- `package.json` must never be modified unless it is explicitly listed in "Files to change". The PO manages library installation — never install or modify dependencies.
- `jest.config.js` must never be modified unless it is explicitly listed in "Files to change".
- If a file needs to change that is not listed, stop and raise it as a question rather than making the change silently.

## 9. Testing Rules
- **Render-without-crashing only.** Tests assert that a component renders without throwing. No style assertions, no snapshot tests, no content assertions.
- **Never use `fireEvent.click()`** — use `fireEvent.press()` in React Native testing.
- **Never use `findByTestId()`** unless `testID` props are explicitly defined in the component.
- For smart component tests, mock `incyclist-services` at module level using `jest.mock('incyclist-services', () => ({ ... }))`.

## 10. TypeScript and ESLint Compliance

### Inline styles
- **Never put style object literals directly on JSX props.** This violates `react-native/no-inline-styles`.
- Static styles belong in `StyleSheet.create()` at the bottom of the file.
- Dynamic styles (values derived from screen dimensions or props) must be extracted as named `const` objects above the JSX return:
```typescript
// ✅ Correct
const dynamicStyle = { height: screenHeight * 0.12, width: screenWidth * 0.15 };
return <View style={[styles.container, dynamicStyle]} />;

// ❌ Wrong
return <View style={[styles.container, { height: screenHeight * 0.12 }]} />;
```

### Nested component definitions
- **Never define a component inside another component's render body.** This triggers `react/no-unstable-nested-components` and causes React to unmount and remount the subtree on every render.
- Move sub-components outside the parent function, or into a separate file if they are reusable.
```typescript
// ✅ Correct — defined outside
const FileChip = ({ label, onPress }: { label: string; onPress: () => void }) => ( ... );
export const MyView = () => { return <FileChip label="JSON" onPress={fn} />; };

// ❌ Wrong — defined inside render
export const MyView = () => {
    const FileChip = ({ label }: { label: string }) => ( ... ); // triggers ESLint error
    return <FileChip label="JSON" />;
};
```

### Inline callbacks on JSX props
- **Never pass inline arrow functions directly as JSX event props.** Wrap all callbacks in `useCallback`.
```typescript
// ✅ Correct
const handlePress = useCallback(() => setActiveDialog(null), []);
return <Button onClick={handlePress} />;

// ❌ Wrong
return <Button onClick={() => setActiveDialog(null)} />;
```

### Types from incyclist-services
- **Always import types from `incyclist-services` — never redefine them locally.** If a type is needed, it must be named explicitly in the task's Key references section and imported at the top of the file.
- If a type appears to be missing from `incyclist-services`, raise it as a question rather than defining it locally.
