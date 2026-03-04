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

## Reservation Concurrency Notes

### How race conditions are handled

- Reservation and checkout flows run inside Prisma database transactions with `Serializable` isolation.
- Stock decrement is guarded by a conditional write:
  - update product only when `availableStock >= requestedQuantity`.
  - if condition fails, reservation is rejected with a conflict.
- Reservation state transitions are conditional (`ACTIVE -> COMPLETED` or `ACTIVE -> EXPIRED`) to prevent double-processing.
- Expiration worker processes overdue reservations in short transactions, reducing lock contention with checkout.
- Net effect: no overselling and stock does not go negative, even under concurrent requests.

### Trade-offs

- `Serializable` transactions improve correctness but increase contention and can reduce throughput during bursts.
- In-process expiration worker is simple, but if API instances are down, expiration pauses until service recovers.
- Polling-based frontend updates are simpler than websocket streams, but data can be stale between poll intervals.
- Conflict/timeout responses are expected under contention; correctness is prioritized over always succeeding requests.

### What could break at 10 concurrent users

At roughly 10 concurrent users this system should generally work, but potential stress points are:

- More `409`/`503` responses during simultaneous reserve/checkout on the same product.
- Short-lived UX staleness (user sees stock available, then reserve fails because another user won first) - this staleness can happen in 5s because evry 5s we get realtime data 


Important: correctness should still hold (no negative stock, no oversell)

### How to scale this system

1. Move expiration to a distributed job system:
   - Use a queue/worker (BullMQ, SQS, etc.) or DB-backed scheduler.
   - Ensure idempotent processing and leader/lock coordination.

2. Add transient error retry policy:
   - Retry `P2028`/serialization-conflict style failures with bounded exponential backoff.

3. Add caching/read optimization:
   - Cache product reads (Redis) with short TTL.
   - Keep writes strongly consistent in Postgres.

4. Improve observability:
   - Add metrics for reservation success rate, conflict rate, timeout rate, and worker lag.
   - Add tracing for reserve/checkout critical paths.

5. Horizontal scale safely:
   - Multiple API instances behind a load balancer.
   - Shared Postgres + centralized worker/queue.
   - Keep transaction boundaries and conditional updates as the concurrency safety core.
