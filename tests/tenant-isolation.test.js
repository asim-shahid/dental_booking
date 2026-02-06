const BASE_URL = 'http://localhost:3000';

async function runTenantIsolationTest() {
    console.log('TEST 4: TENANT ISOLATION\n');

    const tenantA = 'tenant-A-isolation';
    const tenantB = 'tenant-B-isolation';

    // Create booking as Tenant A
    const createRes = await fetch(`${BASE_URL}/bookings`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Tenant-ID': tenantA,
            'X-Idempotency-Key': 'isolation-test-key'
        },
        body: JSON.stringify({ start_time_utc: '2024-07-01T09:00:00Z' })
    });
    const createData = await createRes.json();
    const bookingId = createData.booking.id;
    console.log(`Tenant A created booking: ${bookingId}`);

    // Try to list as Tenant B
    const listRes = await fetch(`${BASE_URL}/bookings`, { headers: { 'X-Tenant-ID': tenantB } });
    const listData = await listRes.json();
    console.log(`Tenant B list count: ${listData.count}`);

    // Try to get specific booking as Tenant B
    const getRes = await fetch(`${BASE_URL}/bookings/${bookingId}`, { headers: { 'X-Tenant-ID': tenantB } });
    console.log(`Tenant B get by ID: ${getRes.status}`);

    // Verify Tenant A can see their own
    const verifyRes = await fetch(`${BASE_URL}/bookings/${bookingId}`, { headers: { 'X-Tenant-ID': tenantA } });
    console.log(`Tenant A get own: ${verifyRes.status}`);

    const passed = listData.count === 0 && getRes.status === 404 && verifyRes.status === 200;

    if (passed) {
        console.log('\nPASSED: Tenant isolation works correctly\n');
    } else {
        console.log('\nFAILED: Tenant isolation broken\n');
        process.exit(1);
    }
}

runTenantIsolationTest().catch(console.error);
