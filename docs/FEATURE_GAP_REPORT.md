# DoNow Mobile — Feature Gap Report

Generated: June 9, 2026

## Summary

This document captures the Phase‑1 audit findings comparing the DoNow web app (source of truth) with the React Native (Expo) mobile app. It lists feature gaps, navigation issues, architecture mismatches, root cause analysis for deletion reliability, and prioritized next steps.

---

## 1. Feature Gap Table

| Feature                                                  | Web |  Mobile | Status                                                                                           |
| -------------------------------------------------------- | --: | ------: | ------------------------------------------------------------------------------------------------ |
| Tasks (CRUD, subtasks, reorder, filters, search)         | Yes | Partial | Partial — core CRUD exists but mobile splits online/offline, weak sync, differing subtask UX     |
| Projects (list, create)                                  | Yes | Partial | Partial — mobile filters tasks to show projects; does not consistently use project API endpoints |
| Project Detail (full)                                    | Yes |      No | Missing — mobile lacks `ProjectDetail` screen (info, progress, members, activity)                |
| Collaboration (invite, accept, members, roles, activity) | Yes | Partial | Partial — invitations & accept/decline exist; invite UI and member management incomplete         |
| AI Assistant (chat + actions)                            | Yes | Partial | Partial — context & services exist; chat UI, persistence, and streaming fragility remain         |
| AI task creation/edit                                    | Yes | Partial | Partial — action executor exists but end-to-end AI UI flow incomplete                            |
| Calendar                                                 | Yes |      No | Missing                                                                                          |
| Daily Routine (routines)                                 | Yes | Partial | Partial — backend support; mobile helpers exist but UI missing                                   |
| Notifications                                            | Yes |      No | Missing — no notification center or push integration on mobile                                   |
| Admin / Settings                                         | Yes |      No | Missing or deferred                                                                              |

---

## 2. Navigation Audit (Mobile)

- Current tabs (see `mobile/App.js`): Home (Dashboard), Tasks, Projects, Profile.
- Missing or unreachable screens compared to web:
  - `ProjectDetail` (`/project/:id`) — missing on mobile.
  - AI Chat (web has unified assistant modal) — missing mobile chat screen.
  - Calendar screen — missing.
  - Daily Routine screen — missing.
  - Notifications center — missing.
  - Settings / Admin pages — missing.
- Dead / risky patterns:
  - Projects surfaced by filtering `task.type === 'project'` instead of calling `/api/projects` — duplicates server logic and can miss server-side behavior.
  - `MyTasksScreen` exposes `online | offline` mode toggle which diverges from web UX and encourages wrong mental model.
- Hidden features to expose:
  - Invite collaborator flow and member management from Project Detail.
  - Project editing and activity feed.

---

## 3. Architecture Audit — Key Findings

- Backend:
  - Server models projects as `Task` documents with `type: 'project'` and exposes `/api/projects` routes alongside task endpoints.
- Mobile mismatches:
  - Projects: client-side filtering (getTasks then filter by type) instead of using `/api/projects` endpoints.
  - Storage & sync:
    - Separate `localTaskService` (AsyncStorage) and `taskAPI` (remote) with `syncManager` that naively concatenates local + remote.
    - No id mapping from local to server IDs, no persistent op queue, no background worker to flush offline operations.
    - UI presents `online/offline` mode toggle; user must choose storage type — wrong UX.
  - Deletion/update race conditions due to missing queueing and reconciliation.
  - AI streaming: RN fetch streaming is fragile; mobile code attempts fallbacks but reliability varies.
  - Security: tokens stored in AsyncStorage; consider SecureStore for production.
  - No conflict-resolution policy or comprehensive tests for sync flows.

---

## 4. Task Deletion — Root Cause Analysis

Observed: tasks sometimes reappear after deletion or show ghost entries.

Root causes:

- Local vs remote duplicates with different IDs; deleting only local copy causes server copy to return on next sync.
- No persistent deletion queue for offline deletes — operations are lost or retried incorrectly.
- UI sometimes removes items before server confirms (no uniform optimistic-delete + rollback pattern).
- Authorization errors (delete attempted by non-owner) are not surfaced clearly and cause inconsistent state.

Recommended fix (summary):

- Implement a persistent operation queue (create/update/delete) stored locally.
- Use optimistic UI updates but mark items as `pendingDelete` / `pendingCreate` until server confirms.
- On network reconnect, process queue with retry/backoff and idempotency.
- On successful create, replace local id with server id and update mappings.
- Add tests covering offline create → sync → delete cycles.

---

## 5. Prioritized Implementation Plan (short-term)

Immediate sprint (high priority):

1. Add `ProjectDetail` screen (read-only parity) and wire navigation from Projects list. (Files: `mobile/screens/ProjectDetail.js`, update `App.js` and `CollaborativeTasksScreen` navigation.)
2. Replace client-side project filtering with `/api/projects` usage in `CollaborativeTasksScreen` and Dashboard.
3. Implement unified delete flow prototype: optimistic remove + persistent delete queue + background worker; add unit tests.
4. Scaffold `AIChatScreen` (skeleton) and persist conversation history using `AIAssistantContext`.

Mid-term (critical):

- Redesign `syncManager` into a unified sync subsystem with reconciliation, id-mapping, and conflict rules.
- Remove `online/offline` mode toggle UI — present unified task feed.
- Implement full collaboration flows: invite, accept/decline, remove collaborator, and member management UI.

Long-term (finish parity):

- Full AI assistant parity (streaming stability, actions, message persistence).
- Calendar, Daily Routine, Notifications screens and push integration.
- Design system parity: map web tokens to mobile `theme/*` and refactor components.

---

## 6. Files to Modify / Add (proposed)

Modify:

- `mobile/screens/CollaborativeTasksScreen.js` (use `/api/projects`)
- `mobile/screens/DashboardScreen.js` (project counts from `/api/projects`)
- `mobile/services/syncManager.js` (rework merging + reconciliation)
- `mobile/services/apiService.js` (add `getProjects`, `createProject`, `inviteProject` wrappers)
- `mobile/services/localStorageService.js` (add persistent op queue)
- `mobile/services/aiService.js` (streaming resilience)
- `mobile/context/AIAssistantContext.js` (persist conversations)

Add:

- `mobile/screens/ProjectDetail.js`
- `mobile/screens/AIChatScreen.js`
- `mobile/services/syncQueue.js` (background processor)
- `mobile/components/CollaboratorModal.js` (invite UI)
- `mobile/hooks/useNetworkSync.js` (NetInfo + background sync)
- Tests for sync and deletion flows
- `docs/FEATURE_GAP_REPORT.md` (this file)

---

## 7. Risks & Mitigations

- AI streaming in RN: fallback non-streaming mode and progressive UI updates; test on Expo Go and production builds.
- Race conditions: single-threaded queue with mutex and idempotent server operations.
- Data loss: retain local copies until server confirms deletions/updates; add visible pending states.
- Auth storage security: provide `authStorage` abstraction; recommend `expo-secure-store` in production.

---

## 8. Next Steps

Recommended immediate actions:

- Implement `ProjectDetail` screen and wire navigation (quick win to increase parity).
- Implement deletion queue and background sync prototype (critical for data integrity).
- Scaffold `AIChatScreen` and persist messages in `AIAssistantContext` (prepares for Phase 2).

---

_End of report._
