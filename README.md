# numsapi

✅ Small Node.js user management API (Express + Prisma + MySQL). This README explains how to clone the repo, configure environment variables, run the app locally, run tests, and exercise the app via curl or Postman.

---

## Requirements

- Node.js (v18+ recommended)
- npm
- MySQL (or compatible) database
- Git

---

## Clone

```bash
git clone https://github.com/cyb3rkh4l1d/numsapi.git
cd numsapi
```

---

## Install dependencies

```bash
npm install
```

---

## Environment

Create a `.env` file in the project root. Minimum variables:

```env
DATABASE_URL="mysql://<user>:<password>@<host>:<port>/<db>?allowPublicKeyRetrieval=true&ssl=false"
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=1d
PORT=3000
LOG_LEVEL=debug
# set LOG_PRETTY='true' locally if you want pretty logs (optional and requires pino-pretty)
# LOG_PRETTY=true
```

Notes:

- If the database password contains special characters (e.g., `@`, `$`, `~`), URL-encode them (e.g., `@` → `%40`).
- The `allowPublicKeyRetrieval=true&ssl=false` options are often necessary for local MySQL setups; adjust for your environment.

---

## Database

The project includes Prisma and a saved migration at `prisma/migrations/*`.

Apply migrations (recommended for non-development):

```bash
npx prisma migrate deploy
```

For quick local development, you can push the schema (non-destructive option):

```bash
npx prisma db push
```

Seed admin user (creates an admin user if not present):

```bash
node prisma/seed/admin.js
```

Quick DB check (debug script included):

```bash
node scripts/debug-prisma.js
```

---

## Run the app

Start with nodemon (dev):

```bash
npm start
```

Start directly (production-style):

```bash
node src/server.js
```

By default the server listens on `PORT` (3000 if not set).

---

## Tests & Lint

- Run tests: `npm test`
- Lint: `npm run lint`
- Format: `npm run format`

---

## Logging

- Structured logging is implemented using `pino`.
- Request-scoped logger is available as `req.log` and `X-Request-Id` is set on responses.
- Environment variables you can use: `LOG_LEVEL` (e.g. `debug`, `info`), `LOG_PRETTY=true` to get pretty output locally (requires adding `pino-pretty` as a dev dep).

---

## API (curl examples)

Replace `{{base}}` with `http://localhost:3000`.

- Register user:

```bash
curl -s -X POST http://localhost:3000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{"fullName":"Test User","dob":"1990-01-01","email":"user@example.com","password":"User@123"}' | jq
```

- Login user:

```bash
curl -s -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"User@123"}' | jq
```

- Get user by id (authenticated):

```bash
curl -s -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/users/<userId> | jq
```

- Block user (can be performed by the **admin** or the **user himself**):

```bash
# as admin
curl -s -X PUT http://localhost:3000/api/users/block/<userId> \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" | jq

# as the same user (self-block)
curl -s -X PUT http://localhost:3000/api/users/block/<userId> \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq
```

- List users (admin):

```bash
curl -s -H "Authorization: Bearer $ADMIN_TOKEN" http://localhost:3000/api/users/all | jq
```

---

## Postman

You can create a Postman environment with variables:

- `baseUrl` = `http://localhost:3000`
- `token`, `adminToken`, `userId`

Use the same endpoints shown in the curl examples and add Tests to capture tokens/ids.

---

## Troubleshooting

- If you see `Prisma error: RSA public key is not available client side` or a pool timeout, check your `DATABASE_URL` and add `allowPublicKeyRetrieval=true` and URL-encode the password.
- If the server returns `500` on register, inspect server logs (pino logs are printed to stdout) and verify DB connectivity.

---

## Contributing

- Run tests and lint before opening a PR: `npm test && npm run lint`.
- Add tests for new behavior and follow project style.

---

If you'd like, I can also add a ready-to-import Postman collection file to the repo — say "Add Postman collection" and I'll create it and include example test scripts.
