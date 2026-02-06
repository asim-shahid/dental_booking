import pool from './config.js';

async function reset() {
    try {
        const result = await pool.query('DELETE FROM bookings');
        console.log(`Deleted ${result.rowCount} bookings`);
    } catch (error) {
        console.error('Reset failed:', error.message);
    } finally {
        await pool.end();
    }
}

reset();
