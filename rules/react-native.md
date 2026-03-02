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
- **Component Content** Every component should have it's own folder under src/components and should also be exported from src/components/index.ts.  The folder should always conain
  - index.ts : containing exports
  - types.ts : containing types 
  - <ClassName>.tsx  The actual component
  - <ClassName>.stories.tsx The storybook of this component
  - <SubComponent>.tsx  any local sub component that will not be re-used by others
  - utils.ts    helper functions just used in this component
- **Page Components** Page components are special components as they represent a full page (screen) of the application. They should be stored in src/pages but otherwise the same rules apply as desribed for other components
- **Business Logic Integration** Whenever the component requires business logic as indicated in the prompt, then the component should actually be split into two parts
  - The exported component, which typically will use an useEffect hook to call a function in incyclist-services that returns an observer. The observer typicall will provide event indicating state updated (requiring re-render)
  - A 'view' component used internally by the exported component. This view does not contain any business logic, just renders the props as provided by the exported component. However this view component should be used for Storybook, so that we don't need to work with Mocks, but just can provide variants of the data to be shown
  - But this split should only be done if it explicitely mentioned in the prompt that the component requires business logic from incyclist-services or from any other external source

- ** Styling/Theming** Re-use styles/themes as much as possible. 
  - All colors should be defined in src/theme/colors.ts
  - All text sizes should be defined in src/theme/textSizes.ts
  - Reusable styles should be defined in src/theme/styles.ts
  Imports must be done relative to the component directory 

- ** Assets** should be stored in src/assets. 
- ** Logging ** where indicated that logging is required within a component, use the useLogging hook
- Don't use default exports

## 3. Helper functions
- **Hooks:** Manage all lifecycle and local state using React Hooks (`useState`, `useEffect`, `useMemo`, etc.).

## 3. Business Logic (Incyclists Services)
- **Separation of Concerns:** Components must remain "thin" and focus only on UI/UX.
- **Logic Location:** Do NOT develop business logic, data transformations, or API calls inside this project. 
- **Integration:** All business logic must be imported from the `incyclists-services` project. Reference or ask for methods from this service when implementing functionality.

## 4. Observer Subscription Pattern

When a component subscribes to an `IObserver` instance, always follow this structure:

- **Subscribe once** using `useEffect` with a `refInitialized` gate. Do not put cleanup inside the effect's return function.
- **Unsubscribe and reset** in a single `useUnmountEffect`. This is the only place `observer.off` is called and refs are reset.
- **Event handler** must be defined as `useCallback` above both hooks so it can be referenced in both.

Never use the `useEffect` return function to call `observer.off` — this leads to premature unsubscription on re-renders and inconsistent cleanup behaviour.

## 5. Naming Conventions
- **Files/Components:** Use PascalCase (e.g., `UserProfile.tsx`).
- **Hooks/Variables:** Use camelCase (e.g., `useUserData`).

## Storybook 
- The project uses  @storybook/react-native-web-vite 
- All eventhandlers should be provided with fn()  (from 'storybook/test')

## React Native Version
- The app is using ReactNeative 0.83.1 or higher. Please consider this when giving instructions or selting libraries
- The native code is written in Kotlin(Android) and Swift (IOS) 


## Usage of libraries
- If the implementation can be significantly improved or is only possible by using external libraries, then before implementation is done performa a research of available libraries
- List the libraries and provide information on popularity, maintenance, support and potential license issues
- align in the library to be used before starting the implementation
- for the selected/aligned library. Document the setep required to install & integrate in all relevant OS's (Android, IOS, tvOS)