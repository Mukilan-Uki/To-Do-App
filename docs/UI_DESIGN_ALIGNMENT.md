# UI / Design Alignment

Summary of changes applied to align mobile UI with web:

- Color tokens in `mobile/theme/colors.js` were reviewed and aligned to web branding.
- Typography tokens in `mobile/theme/typography.js` adjusted to match visual hierarchy used on the web.
- Spacing and radius tokens standardized in `mobile/theme/colors.js` to match the web scale.
- Navigation labels updated to `Dashboard`, `MyTasks`, `Projects`, `Profile` to mirror web route names.

Recommendations / next steps:

- Run a visual QA pass across main screens comparing to web screenshots.
- Add a small design diff test harness (snapshot-based or storybook) to prevent regressions.
- If exact pixel parity is required, export web tokens (CSS variables) into a shared JSON and import them into mobile theme.
