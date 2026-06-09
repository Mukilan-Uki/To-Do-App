# PR Draft: Mobile parity, sync reliability, AI assistant

Summary

- Align mobile app with web feature set and reliability.
- Major areas: persistent sync queue + id mapping, sync reconciliation, AI streaming, project & collaboration UI, navigation and design tokens.

Files changed (high level)

- mobile/services/syncQueue.js — persistent queue, id-map, immediate processing, locking, backoff
- mobile/services/syncManager.js — last-write-wins merge logic
- mobile/services/localStorageService.js — replaceLocalId helper
- mobile/screens/AIChatScreen.js — streaming integration using `aiService.streamUnifiedMessage`
- mobile/screens/ProjectDetail.js, mobile/components/CollaboratorModal.js, mobile/components/ProjectEditModal.js — project & collaboration UIs
- mobile/**tests**/ — added service/unit tests for queue, reconciliation, and syncManager
- mobile/App.js — navigation labels aligned to web (Dashboard/MyTasks)
- mobile/theme/\* — tokens aligned to web
- docs/\* — CHANGELOG, PR_SUMMARY, QA_CHECKLIST, UI_DESIGN_ALIGNMENT, navigation/architecture audits

Testing

- Unit tests added and executed in `mobile`:
  - `npm install` (if needed)
  - `npm test`
- Manual QA checklist attached in `docs/QA_CHECKLIST.md`.

Migration notes

- No backend changes required; mobile uses existing `/api/tasks` and `/api/projects` endpoints.
- Offline-created tasks will be assigned server IDs on next sync; clients must handle local->server id replacement (handled by `replaceLocalId`).

How to validate locally

1. Start backend API (or point `EXPO_PUBLIC_API_URL` to a running server).
2. In `mobile`:

```bash
npm install
npm start
# or run tests
npm test
```

Followups / optional improvements

- Add E2E tests (Detox or Cypress for web + mobile) for full reconciliation flows.
- Add server-side change feed or timestamps to simplify merging.
- Wire AI assistant actions to automatic task creation/update flows (server-supported action schema available in `server/services/aiPrompt.js`).

PR checklist (to include in PR body)

- [ ] Tests pass (`npm test` in `mobile`).
- [ ] QA checklist completed.
- [ ] Changelog entry reviewed (`docs/CHANGELOG.md`).
- [ ] PR summary attached (`docs/PR_SUMMARY.md`).
