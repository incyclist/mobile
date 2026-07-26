// Deliberately NOT re-exported from `src/hooks/index.ts` (unlike sibling hook folders such as
// `ride`) - matches the existing precedent set by `hooks/files/useFilePicker` (also consumed via
// its own subfolder path, not the shared barrel). `useScheduledWorkoutPrompt` pulls in
// `'../../services'`, which also re-exports `PermissionsService` (requires
// `react-native-permissions` at module-load time). `src/hooks/index.ts` is imported by
// foundational, widely-used components like `ButtonBar` (just for `useLogging`/
// `useScreenLayout`) - re-exporting this hook there would transitively drag
// `react-native-permissions` into every one of those consumers, most of which have no reason to
// know about (or mock) it. Import directly from `'../../hooks/workouts'` instead.
export * from './useScheduledWorkoutPrompt';
