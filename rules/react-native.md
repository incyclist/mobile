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

## 3. Business Logic (Incyclists Services)
- **Separation of Concerns:** Components must remain "thin" and focus only on UI/UX.
- **Logic Location:** Do NOT develop business logic, data transformations, or API calls inside this project. 
- **Integration:** All business logic must be imported from the `incyclists-services` project. Reference or ask for methods from this service when implementing functionality.

## 4. Naming Conventions
- **Files/Components:** Use PascalCase (e.g., `UserProfile.tsx`).
- **Hooks/Variables:** Use camelCase (e.g., `useUserData`).

## React Native Version
- The app is using ReactNeative 0.83.1 or higher. Please consider this when giving instructions or selting libraries
- The native code is written in Kotlin(Android) and Swift (IOS) 

