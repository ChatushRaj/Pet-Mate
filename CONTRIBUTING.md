# Contributing to PetMate

Thanks for your interest in contributing! This is a portfolio project, but it's built and maintained like a real one — issues and pull requests are welcome.

> **Licence:** this project is *not* open source — see [LICENSE](LICENSE). Issues and suggestions are welcome; by submitting a pull request you agree that the copyright holder may use your contribution under this project's terms.

## Getting started

1. Fork the repo and clone your fork.
2. Follow the setup steps in the [README](README.md) to get the client, server, and database running locally.
3. Create a branch off `main`:
   ```bash
   git checkout -b feature/short-description
   ```

## Development workflow

- **Server** (`server/`): Express + MySQL. Run `npm run dev` for auto-restart on changes (via `nodemon`).
- **Client** (`client/`): Create React App. Run `npm start` for the dev server with hot reload.
- Keep the two in sync — if you change an API response shape in `server.js`, update the corresponding calls in `client/src/api.js` and any component that consumes it.

## Code style

- Match the existing style in the file you're editing rather than introducing a new pattern.
- Prefer the shared design system in `client/src/theme.css` (CSS variables, `.btn`, `.card`, `.field`, etc.) over one-off styles.
- All database queries must use parameterized placeholders (`?`) — never string-concatenate user input into SQL.
- Never commit secrets. `.env` files are git-ignored; use `.env.example` as the template for any new environment variable.

## Before opening a pull request

- [ ] `npm run build` succeeds in `client/`
- [ ] `npm test -- --watchAll=false` passes in `client/`
- [ ] The server starts cleanly (`npm start` in `server/`) against a local database set up from `server/schema.sql`
- [ ] No secrets, credentials, or personal information in the diff
- [ ] Commit messages describe *what* changed and *why*

## Reporting bugs / requesting features

Please use the issue templates under **Issues → New Issue** — they'll prompt for the information that's actually useful for reproducing or scoping the work.

## Security issues

Please do **not** open a public issue for security vulnerabilities. See [SECURITY.md](SECURITY.md) instead.
