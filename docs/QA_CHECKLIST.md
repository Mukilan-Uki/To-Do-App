# QA Checklist

- [ ] Verify navigation labels: `Dashboard`, `MyTasks`, `Projects`, `Profile`.
- [ ] Confirm `ProjectDetail` route opens and shows members, tasks, edit modal.
- [ ] Validate offline create/delete flows: create task offline, reconnect, ensure task appears on server and local id replaced.
- [ ] Test collaborator invite/remove flows end-to-end.
- [ ] Test AI Assistant flows: ask question, ensure streaming response appears; test when server not reachable.
- [ ] Run unit tests: `cd mobile && npm test`.
- [ ] Run a smoke test on Android and iOS (Expo) to validate UI and navigation.
- [ ] Create PR and ensure CI runs tests; attach QA checklist to PR description.
