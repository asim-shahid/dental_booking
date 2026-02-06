import pool from './config.js';

const schema = `
DROP TABLE IF EXISTS bookings;

CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR(255) NOT NULL,
    start_time_utc TIMESTAMPTZ NOT NULL,
    idempotency_key VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_tenant_slot UNIQUE (tenant_id, start_time_utc),
    CONSTRAINT unique_tenant_idempotency UNIQUE (tenant_id, idempotency_key)
);

CREATE INDEX idx_bookings_tenant_id ON bookings(tenant_id);
CREATE INDEX idx_bookings_start_time ON bookings(start_time_utc);
`;

async function setup() {
    try {
        await pool.query(schema);
        console.log('Schema created');
    } catch (error) {
        console.error('Setup failed:', error.message);
        throw error;
    } finally {
        await pool.end();
    }
}

setup();
