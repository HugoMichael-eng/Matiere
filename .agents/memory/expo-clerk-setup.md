---
name: Expo Clerk setup
description: Gotchas encountered building the Sillage Lab mobile Expo app with Clerk auth and React Query v5.
---

## @clerk/clerk-expo peer dep gap

`@clerk/clerk-expo` does NOT list `expo-auth-session` in its peerDependencies, but Metro will fail with "Unable to resolve module expo-auth-session" if it's missing. Add `expo-auth-session: ~7.0.11` (match current Expo SDK) to the Expo app's package.json manually.

**Why:** Clerk's SSO hook imports expo-auth-session at runtime; pnpm doesn't auto-install unlisted peers.

**How to apply:** Any time @clerk/clerk-expo (or @clerk/expo) is added to an Expo project, add expo-auth-session alongside it.

## React Query v5: no onSuccess in useQuery

`useQuery`'s `onSuccess` callback was removed in TanStack React Query v5. Using it causes a TypeScript error (and silent runtime ignore in some builds). Use `useEffect` watching `data` instead:

```tsx
const { data } = useGetConversation(id);
useEffect(() => {
  if (data && !initialized) {
    setMessages(data.messages.map(...));
    setInitialized(true);
  }
}, [data, initialized]);
```

**Why:** Breaking change in v5 — callbacks moved out of query options entirely.

## S1 native hooks and components now exist

S1 (`@workspace/s1`) now exports:
- `@workspace/s1/lib/native-theme` → `nativeTheme` (colors, radius, spacing, fontFamily)
- `@workspace/s1/hooks/use-colors` → `useColors()` (color scheme aware)
- `@workspace/s1/hooks/use-fonts` → `useDesignSystemFonts()` (Inter weights)
- `@workspace/s1/components/native/button`, card, spinner, typography, badge, input

Expo apps should depend on `@workspace/s1` as a workspace dep and import from these paths directly.

## EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY

Pass via the dev script inline: `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=$CLERK_PUBLISHABLE_KEY` prepended to the existing pnpm exec expo start command. This works because pnpm scripts run in the shell with Replit secrets available as env vars.

## @clerk/clerk-expo is deprecated

As of mid-2026, `@clerk/clerk-expo` is deprecated in favour of `@clerk/expo`. The old package still works but shows a deprecation warning. Task #21 tracks the migration.
