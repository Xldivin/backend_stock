# Stock_Drop_be

Starter TypeScript API using Express + Prisma + PostgreSQL.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Generate Prisma client:

```bash
npm run prisma:generate
```

3. Run initial migration:

```bash
npm run prisma:migrate -- --name init
```

4. Start the API in dev mode:

```bash
npm run dev
```

## Endpoints

- `GET /health` basic service health.
- `GET /health/db` database connectivity check.