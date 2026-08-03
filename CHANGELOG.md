# Changelog

All notable changes to this project are documented in this file.
This project follows [Semantic Versioning](https://semver.org/).

## [1.0.0] - 2026

### Added
- Local MySQL schema (`server/schema.sql`) with 7 tables, foreign keys, and seed data — replaces the previous dependency on a third party's AWS RDS instance.
- Real, database-backed CRUD for pets, volunteers, adopters, rescue organizations, pet centers, and adoptions (previously mock/hardcoded data).
- Centralized API client (`client/src/api.js`) — a single axios instance with an auth-token interceptor, used by every component instead of 27 scattered hardcoded `localhost` URLs.
- Role-based dashboard stats computed with real SQL aggregation queries per role (admin / rescue_org / pet_center).
- Redesigned UI across every screen: shared design tokens (`theme.css`), rebuilt dashboard, login, and all five CRUD management screens with a consistent card/table/form system.
- GitHub project docs: `CONTRIBUTING.md`, `SECURITY.md`, `CHANGELOG.md`, `CODE_OF_CONDUCT.md`, issue templates, and a pull request template.

### Changed
- `mysql` (callback-based, unmaintained) → `mysql2/promise` for the server's database layer.
- `bcrypt` upgraded to v6, resolving a critical transitive vulnerability in its dependency tree.
- `react-router-dom` pinned to v6 — v7's ESM-only package exports broke Jest's module resolution under Create React App's (non-ejected) test config.
- API routes standardized on consistent kebab-case naming (`/api/pet-centers`, `/api/rescue-organizations`, etc.); several legacy client screens were calling endpoints that didn't exist on the server at all.

### Fixed
- **Critical:** removed hardcoded AWS RDS database credentials and a hardcoded JWT signing secret from `server.js` — both now come from environment variables (`.env`, git-ignored).
- Fixed a broken ESLint config (`react-app/jest`) that was silently incompatible with the currently-resolved `eslint-plugin-jest`, which was failing both `npm run build` and `npm test`.
- Fixed the default Create React App boilerplate test (`renders learn react link`) which no longer matched the actual app and would have failed.
- Removed dead code: an unused `dashboard.jsx`/`dashboard.css` pair, the default CRA `App.css` and `logo.svg` (never imported), and an unused `axios` dependency in the server.

### Security
- All database credentials and secrets moved out of source control.
- Zero `npm audit` findings in `server/` (down from 14, including one critical).
- Documented and deliberately left the `client/`-side `react-scripts` dev-tooling advisories (see [SECURITY.md](SECURITY.md) for why forcing a fix would break the build).
