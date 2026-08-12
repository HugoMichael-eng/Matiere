---
name: History feature implementation
description: Persistent coach conversations, formula changelog, and activity feed — all wired end-to-end.
---

## What was built
- **Coach conversations**: `conversations` + `conversationMessages` DB tables. Routes at `/conversations`, `/conversations/:id`, `/conversations/:id/messages`. The send-message route passes full prior history to OpenAI for continuity.
- **Formula changelog**: `formulaEvents` table. Emitted on create/update/delete inside `formulas.ts`. Route at `/formulas/:id/events`. Displayed in FormulaDetail aside.
- **Activity feed**: `GET /activity` returns all events for the user, newest first. Shown on Dashboard when events exist.
- **Quick prompt on Dashboard**: `QuickPrompt` component — creates a conversation + sends first message in one flow, then navigates to `/coach?conv=<id>`. MaterialHero (scent-of-the-day) was removed to make room.
- **Coach deep-link**: Coach reads `?conv=<id>` URL param and pre-selects that conversation on mount.

## Key technical notes
- `zod` had to be added explicitly to `@workspace/api-server` dependencies (not a workspace default).
- `useSendCoachingMessage` (old single-turn route) is no longer used in Coach; the new conversation flow goes through `/conversations/{id}/messages`.
- orval regenerates hooks from openapi.yaml — run `cd lib/api-spec && pnpm orval` after any spec change.
- `drizzle-kit push` (in `lib/db/`) applies schema changes to the dev database.

**Why:** Future sessions should know zod must be installed per-package in api-server, and that any new history-adjacent DB tables need a drizzle push.
