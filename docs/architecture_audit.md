# Architecture Audit

Key points:

- Backend is source-of-truth. Mobile must call `/api/projects` and `/api/tasks` rather than reimplement filtering.
- Introduced `syncQueue` for offline-first reliability and an id-map for local->server id reconciliation.
- `localStorageService.replaceLocalId` used to swap local ids for server ids after successful create operations.
- Recommendation: add server-provided change feed or last-modified timestamps to simplify reconciliation and reduce conflicts.
