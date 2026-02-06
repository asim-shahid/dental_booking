const BASE_URL = 'http://localhost:3000';

async function runConcurrencyTest() {
    console.log('TEST 1: CONCURRENCY\n');

    const tenantId = 'tenant-concurrency-test';
    const startTimeUtc = '2024-06-15T10:00:00Z';

    const requests = [
        { key: 'concurrent-req-1' },
        { key: 'concurrent-req-2' },
        { key: 'concurrent-req-3' }
    ];

    console.log('Firing 3 concurrent requests...\n');

    const promises = requests.map((req, i) =>
        fetch(`${BASE_URL}/bookings`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Tenant-ID': tenantId,
                'X-Idempotency-Key': req.key
            },
            body: JSON.stringify({ start_time_utc: startTimeUtc })
        }).then(async res => ({ index: i + 1, status: res.status, body: await res.json() }))
    );

    const results = await Promise.all(promises);

    results.forEach(r => {
        console.log(`Request ${r.index}: ${r.status} ${r.status === 201 ? '(created)' : '(conflict)'}`);
    });

    const bookingsRes = await fetch(`${BASE_URL}/bookings`, { headers: { 'X-Tenant-ID': tenantId } });
    const bookings = await bookingsRes.json();

    console.log(`\nDatabase rows: ${bookings.count}`);

    if (bookings.count === 1) {
        console.log('PASSED: Exactly 1 booking exists\n');
    } else {
        console.log('FAILED: Expected 1 booking\n');
        process.exit(1);
    }
}

runConcurrencyTest().catch(console.error);
