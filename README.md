# Backend

Express + Prisma backend for the Skillnack tutoring platform.

It provides the API, authentication, bookings, tutor profiles, reviews, uploads, payments, and seed data used by the frontend.

## Requirements

- Node.js 20 or newer
- PostgreSQL database
- npm

## Install

```bash
npm install
```

Prisma client generation runs automatically after install through the `postinstall` script.

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run seed
```

- `dev` runs the server with `tsx watch`.
- `build` generates Prisma client and bundles the app with `tsup`.
- `start` runs the compiled server from `dist/server.js`.
- `seed` runs the Prisma seed script.

## Environment Variables

Create a `.env` file in the `backend` folder with the variables below:

```env
NODE_ENV=development
PORT=5000
DATABASE_URL=
APP_URL=

BETTER_AUTH_SECRET=
BETTER_AUTH_URL=

CLOUDEINARY_CLOUD_NAME=
CLOUDEINARY_API_KEY=
CLOUDEINARY_API_SECRET=

ADMIN_NAME=
ADMIN_EMAIL=
ADMIN_PASSWORD=

NODEMAILER_HOST=
NODEMAILER_PORT=587
APP_USER=
APP_PASSWORD=

STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
```

Note: the Cloudinary variables use the exact `CLOUDEINARY_*` spelling that the code currently expects.

## Database Setup

If you change the Prisma schema, regenerate the client and apply migrations:

```bash
npx prisma migrate dev
npx prisma generate
```

You can also reseed the database at any time with:

```bash
npm run seed
```

## Development Flow

1. Start PostgreSQL.
2. Configure the `.env` file.
3. Run `npm install`.
4. Run `npm run dev`.

The server listens on the port from `PORT` and exposes the API under `/api/v1`.

## Project Notes

- `src/server.ts` handles startup, database connection, and graceful shutdown.
- `src/app.ts` wires CORS, auth, routes, and the Stripe webhook endpoint.
- In non-production environments, the server also runs the seed script after startup.
