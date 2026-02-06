import pool from './db/config.js';

export async function insertBooking(tenantId, startTimeUtc, idempotencyKey) {
    const normalizedTime = new Date(startTimeUtc).toISOString();

    // Check if booking with this idempotency key already exists (retry case)
    const existingByKey = await pool.query(
        `SELECT id, tenant_id, start_time_utc, idempotency_key, created_at
         FROM bookings WHERE tenant_id = $1 AND idempotency_key = $2`,
        [tenantId, idempotencyKey]
    );

    if (existingByKey.rows.length > 0) {
        return { booking: existingByKey.rows[0], created: false };
    }

    try {
        const result = await pool.query(
            `INSERT INTO bookings (tenant_id, start_time_utc, idempotency_key)
             VALUES ($1, $2, $3)
             RETURNING id, tenant_id, start_time_utc, idempotency_key, created_at`,
            [tenantId, normalizedTime, idempotencyKey]
        );
        return { booking: result.rows[0], created: true };

    } catch (error) {
        if (error.code === '23505') {
            if (error.constraint === 'unique_tenant_slot') {
                const existing = await pool.query(
                    `SELECT id, tenant_id, start_time_utc, idempotency_key, created_at
                     FROM bookings WHERE tenant_id = $1 AND start_time_utc = $2`,
                    [tenantId, normalizedTime]
                );
                return { booking: null, created: false, conflict: true, existingBooking: existing.rows[0] };
            }

            if (error.constraint === 'unique_tenant_idempotency') {
                const existing = await pool.query(
                    `SELECT id, tenant_id, start_time_utc, idempotency_key, created_at
                     FROM bookings WHERE tenant_id = $1 AND idempotency_key = $2`,
                    [tenantId, idempotencyKey]
                );
                return { booking: existing.rows[0], created: false };
            }
        }
        throw error;
    }
}

export async function getBookingsByTenant(tenantId) {
    const result = await pool.query(
        `SELECT id, tenant_id, start_time_utc, idempotency_key, created_at
         FROM bookings WHERE tenant_id = $1 ORDER BY start_time_utc`,
        [tenantId]
    );
    return result.rows;
}

export async function getBookingById(tenantId, bookingId) {
    const result = await pool.query(
        `SELECT id, tenant_id, start_time_utc, idempotency_key, created_at
         FROM bookings WHERE tenant_id = $1 AND id = $2`,
        [tenantId, bookingId]
    );
    return result.rows[0] || null;
}
