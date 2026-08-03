# PetMate

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18-brightgreen.svg)
![React](https://img.shields.io/badge/react-18-61dafb.svg)
![Build](https://img.shields.io/badge/build-passing-brightgreen.svg)
![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)

A pet adoption management platform connecting rescue organizations, pet centers, volunteers, and adopters. React frontend, Express + MySQL backend, JWT-based role authentication (admin / rescue organization / pet center).

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 18 (Create React App), React Router, Font Awesome |
| Backend | Node.js, Express |
| Database | MySQL (via `mysql2`, all queries parameterized) |
| Auth | JWT, bcrypt password hashing |

## Project structure

```
petmate/
├── client/          # React frontend
│   ├── src/
│   │   ├── api.js            # Single centralized API client (all requests go through here)
│   │   ├── login.js           # Login screen
│   │   ├── AdminDashboard.js  # Admin role dashboard
│   │   ├── RescueDashboard.js # Rescue organization role dashboard
│   │   ├── CenterDashboard.js # Pet center role dashboard
│   │   ├── Pet.js, Adopter.js, Volunteers.js, PetCentre.js, RescueOrganisation.js
│   │   │                      # Standalone CRUD screens for each entity
│   │   └── App.js             # Routes
│   └── .env.example           # REACT_APP_API_URL override (optional)
└── server/          # Express backend
    ├── server.js     # All API routes
    ├── schema.sql     # MySQL schema + seed data
    └── .env.example   # Copy to .env and fill in your local MySQL credentials
```

## Getting started (local MySQL)

### 1. Prerequisites
- Node.js 18+
- MySQL Server (running locally)

### 2. Set up the database

```bash
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS petmate"
mysql -u root -p petmate < server/schema.sql
```

This creates all tables and seeds demo data, including three login accounts (all use password `password123`):

| Username | Role | Notes |
|---|---|---|
| `admin` | admin | Full system access |
| `rescue1` | rescue_org | Manages "Happy Paws Rescue" |
| `center1` | pet_center | Manages "Austin Pet Haven" |

### 3. Configure the backend

```bash
cd server
cp .env.example .env
```

Edit `.env` and fill in your local MySQL credentials:

```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_local_mysql_password
DB_NAME=petmate
JWT_SECRET=<generate one - see comment in .env.example>
```

### 4. Install and run

```bash
# Terminal 1 - backend
cd server
npm install
npm start          # runs on http://localhost:9800

# Terminal 2 - frontend
cd client
npm install
npm start           # runs on http://localhost:3000
```

Open `http://localhost:3000` and log in with one of the demo accounts above.

### Running without a database

If you skip the `.env` setup, the server automatically falls back to an in-memory demo mode (same three demo accounts, small fixed dataset) so the app is still explorable without MySQL configured. You'll see this logged on startup: `Running in demo mode with mock data...`

## Security notes

- No credentials are hardcoded anywhere in this codebase — everything sensitive comes from `server/.env`, which is git-ignored and never committed.
- All SQL queries use parameterized statements (`?` placeholders via `mysql2`), so there's no SQL injection surface.
- Passwords are hashed with bcrypt; plaintext passwords are never stored.
- Every protected route requires a valid JWT, checked server-side, with role-based authorization on admin-only and role-specific endpoints.

## Project docs

- [CONTRIBUTING.md](CONTRIBUTING.md) — how to set up a dev environment and submit changes
- [CHANGELOG.md](CHANGELOG.md) — release history
- [SECURITY.md](SECURITY.md) — vulnerability reporting and security practices
- [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)
- [docs/](docs/) — deeper architecture notes and diagrams

## License

See [LICENSE](./LICENSE).
