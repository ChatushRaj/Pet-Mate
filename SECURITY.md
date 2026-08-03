# Security Policy

## Reporting a vulnerability

If you find a security issue in this project, please report it privately rather than opening a public GitHub issue:

- Open a [GitHub Security Advisory](../../security/advisories/new) for this repository, **or**
- Contact the maintainer directly.

Please include:
- A description of the vulnerability and its potential impact
- Steps to reproduce it
- Any relevant logs, screenshots, or proof-of-concept code

You can expect an initial response within a few days.

## Supported versions

This is an actively developed portfolio project. Security fixes are applied to the `main` branch only; there are no maintained release branches.

## Project security practices

This project follows a few practices worth knowing about if you're auditing or building on it:

- **No secrets in source.** All credentials (database, JWT signing key) are loaded from environment variables via `.env` (git-ignored). `.env.example` documents every required variable without real values.
- **Parameterized queries only.** Every database query uses `mysql2`'s parameterized `?` placeholders — no string-concatenated SQL.
- **Password hashing.** User passwords are hashed with `bcrypt` before storage; plaintext passwords are never persisted or logged.
- **JWT-based auth with role checks.** API routes that mutate data are protected by `authenticateToken` middleware, and role-restricted routes (e.g. admin-only) additionally use `authorizeRole`.
- **Dependency scanning.** `npm audit` is run on both `client/` and `server/`. Known findings that are intentionally not "fixed":
  - `client/`: the `react-scripts` (Create React App) dev-tooling dependency tree has long-standing advisories in packages like `webpack-dev-server`/`svgo`. These are build-time-only dependencies, not shipped to end users, and CRA has not published fixes without a breaking major-version change. Forcing a fix here (`npm audit fix --force`) downgrades `react-scripts` to a non-functional version, so it is deliberately left as-is.

## Known limitations (by design, for a portfolio project)

- Rate limiting is not implemented on the login endpoint.
- There is no email verification or password-reset flow.
- Demo credentials are intentionally displayed on the login screen for reviewers/graders — remove the `role-info` block in `client/src/login.js` before using this as a real production login page.
