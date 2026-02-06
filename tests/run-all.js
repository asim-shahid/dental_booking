import { execSync } from 'child_process';

const tests = [
    'tests/concurrency.test.js',
    'tests/idempotency.test.js',
    'tests/tenant-isolation.test.js',
];

let passed = 0;
let failed = 0;

for (const test of tests) {
    try {
        execSync(`node ${test}`, { stdio: 'inherit' });
        passed++;
    } catch (error) {
        failed++;
    }
}

console.log(`Results: ${passed} passed, ${failed} failed`);

if (failed > 0) process.exit(1);
