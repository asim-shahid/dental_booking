# Dental Booking System

A booking system that enforces one invariant:

> For a given (tenant_id, start_time_utc), at most ONE booking may ever exist.

## Setup

```bash
psql -U postgres -c "CREATE DATABASE dental_booking;"
npm install
npm run db:setup
```

## Run

```bash
npm start
```

## API

POST /bookings
```bash
curl -X POST http://localhost:3000/bookings \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: clinic-123" \
  -H "X-Idempotency-Key: req-001" \
  -d '{"start_time_utc": "2024-06-15T10:00:00Z"}'
```

GET /bookings
```bash
curl http://localhost:3000/bookings -H "X-Tenant-ID: clinic-123"
```

GET /bookings/:id
```bash
curl http://localhost:3000/bookings/<uuid> -H "X-Tenant-ID: clinic-123"
```

## Schema

```sql
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR(255) NOT NULL,
    start_time_utc TIMESTAMPTZ NOT NULL,
    idempotency_key VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_tenant_slot UNIQUE (tenant_id, start_time_utc),
    CONSTRAINT unique_tenant_idempotency UNIQUE (tenant_id, idempotency_key)
);
```

## Tests

```bash
npm run test:all
npm run test:concurrency
npm run test:idempotency
npm run test:isolation
```

## Test 3: Manual SQL

```bash
curl -X POST http://localhost:3000/bookings \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: manual-test" \
  -H "X-Idempotency-Key: manual-001" \
  -d '{"start_time_utc": "2024-08-01T10:00:00Z"}'

psql -U postgres -d dental_booking -c \
  "INSERT INTO bookings (tenant_id, start_time_utc, idempotency_key) VALUES ('manual-test', '2024-08-01T10:00:00Z', 'different-key');"
```

Expected:
```
ERROR: duplicate key value violates unique constraint "unique_tenant_slot"
```

## Utility

```bash
npm run db:setup   # Create schema
npm run db:reset   # Clear bookings
npm run db:show    # Show bookings
```

## Environment

| Variable | Default |
|----------|---------|
| DB_HOST | localhost |
| DB_PORT | 5432 |
| DB_NAME | dental_booking |
| DB_USER | postgres |
| DB_PASSWORD | postgres |
| PORT | 3000 |
