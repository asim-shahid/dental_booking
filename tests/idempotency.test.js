const BASE_URL = 'http://localhost:3000';

async function runIdempotencyTest() {
    console.log('TEST 2: IDEMPOTENCY\n');

    const tenantId = 'tenant-idempotency-test';
    const startTimeUtc = '2024-06-20T14:00:00Z';
    const idempotencyKey = 'retry-test-key-001';

    const makeRequest = () => fetch(`${BASE_URL}/bookings`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Tenant-ID': tenantId,
            'X-Idempotency-Key': idempotencyKey
        },
        body: JSON.stringify({ start_time_utc: startTimeUtc })
    });

    const res1 = await makeRequest();
    const data1 = await res1.json();
    console.log(`First request:  ${res1.status} (created: ${data1.created})`);

    const res2 = await makeRequest();
    const data2 = await res2.json();
    console.log(`Second request: ${res2.status} (created: ${data2.created})`);

    const bookingsRes = await fetch(`${BASE_URL}/bookings`, { headers: { 'X-Tenant-ID': tenantId } });
    const bookings = await bookingsRes.json();

    const passed = res1.status === 201 && res2.status === 200 &&
                   data1.booking.id === data2.booking.id && bookings.count === 1;

    console.log(`\nDatabase rows: ${bookings.count}`);
    console.log(`Same booking ID: ${data1.booking.id === data2.booking.id}`);

    if (passed) {
        console.log('PASSED: Idempotency works correctly\n');
    } else {
        console.log('FAILED: Idempotency broken\n');
        process.exit(1);
    }
}

runIdempotencyTest().catch(console.error);
