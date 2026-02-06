import pool from './config.js';

async function showBookings() {
    try {
        const result = await pool.query(
            'SELECT id, tenant_id, start_time_utc, idempotency_key, created_at FROM bookings ORDER BY created_at'
        );
        console.log(`Total bookings: ${result.rows.length}\n`);
        result.rows.forEach(row => {
            console.log(`${row.id}  ${row.tenant_id}  ${row.start_time_utc}  ${row.idempotency_key}`);
        });
    } catch (error) {
        console.error('Query failed:', error.message);
    } finally {
        await pool.end();
    }
}

showBookings();
