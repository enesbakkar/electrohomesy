const { fork } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const PORT = 5050; // Use port 5050 for testing to avoid conflicts
process.env.PORT = PORT;
process.env.NODE_ENV = 'test';

console.log('Starting ElectroHomeSY test server on port 5050...');
const serverProcess = fork(path.join(__dirname, 'server.js'), [], {
    env: { ...process.env, PORT: PORT }
});

// Helper to make HTTP requests and return parsed responses and headers
function request(method, path, body = null, headers = {}) {
    return new Promise((resolve, reject) => {
        const payload = body ? JSON.stringify(body) : '';
        const options = {
            hostname: 'localhost',
            port: PORT,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                ...headers
            }
        };
        if (body) {
            options.headers['Content-Length'] = Buffer.byteLength(payload);
        }

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                let parsed = null;
                try {
                    parsed = JSON.parse(data);
                } catch (e) {
                    parsed = data;
                }
                resolve({
                    status: res.statusCode,
                    body: parsed,
                    headers: res.headers
                });
            });
        });

        req.on('error', (err) => reject(err));
        if (body) req.write(payload);
        req.end();
    });
}

// Extract cookies from set-cookie header array
function extractCookie(headers, cookieName) {
    const cookies = headers['set-cookie'];
    if (!cookies) return null;
    for (const cookie of cookies) {
        if (cookie.startsWith(`${cookieName}=`)) {
            return cookie.split(';')[0].split('=')[1];
        }
    }
    return null;
}

setTimeout(async () => {
    try {
        console.log('\n--- 🏃 Running Automated Security Tests ---');

        // Test 1: Fetch Categories (public route, should also set CSRF cookie)
        console.log('\nTest 1: Fetching categories...');
        const test1 = await request('GET', '/api/categories');
        if (test1.status === 200 && Array.isArray(test1.body)) {
            console.log('✅ Test 1 Passed: Retrieved categories successfully.');
        } else {
            throw new Error(`Test 1 Failed: Status ${test1.status}`);
        }

        const csrfToken = extractCookie(test1.headers, 'csrf_token');
        if (csrfToken) {
            console.log(`✅ CSRF Token successfully initialized by server: ${csrfToken}`);
        } else {
            throw new Error('Test 1 Failed: csrf_token cookie not set by server.');
        }

        // Test 2: CSRF protection on POST (sending request without CSRF header)
        console.log('\nTest 2: Registering customer without CSRF header...');
        const test2 = await request('POST', '/api/customer/register', {
            full_name: 'Test Customer',
            phone_number: '0912345678'
        });
        if (test2.status === 403) {
            console.log('✅ Test 2 Passed: Server successfully blocked request missing CSRF header.');
        } else {
            throw new Error(`Test 2 Failed: Expected 403, got ${test2.status}`);
        }

        // Test 3: Input Validation on registration (invalid phone number format)
        console.log('\nTest 3: Registering customer with invalid phone number...');
        const test3 = await request('POST', '/api/customer/register', {
            full_name: 'Test Customer',
            phone_number: '12345'
        }, {
            'x-csrf-token': csrfToken,
            'Cookie': `csrf_token=${csrfToken}`
        });
        if (test3.status === 400 && test3.body.error) {
            console.log(`✅ Test 3 Passed: Server rejected invalid phone registration: "${test3.body.error}"`);
        } else {
            throw new Error(`Test 3 Failed: Expected 400, got ${test3.status}`);
        }

        // Test 4: Successful Customer Registration with CSRF & Valid Inputs
        console.log('\nTest 4: Registering customer with valid inputs & CSRF...');
        const test4 = await request('POST', '/api/customer/register', {
            full_name: 'Test Customer',
            phone_number: '0993000555'
        }, {
            'x-csrf-token': csrfToken,
            'Cookie': `csrf_token=${csrfToken}`
        });
        if (test4.status === 200 && test4.body.customer) {
            console.log(`✅ Test 4 Passed: Registered customer successfully.`);
        } else {
            throw new Error(`Test 4 Failed: Status ${test4.status}`);
        }

        // Test 5: Authorization check (accessing admin orders without authentication)
        console.log('\nTest 5: Accessing admin orders without auth...');
        const test5 = await request('GET', '/api/orders');
        if (test5.status === 401) {
            console.log('✅ Test 5 Passed: Access denied for unauthenticated admin route.');
        } else {
            throw new Error(`Test 5 Failed: Expected 401, got ${test5.status}`);
        }

        // Test 6: Admin login with incorrect password
        console.log('\nTest 6: Admin login with incorrect credentials...');
        const test6 = await request('POST', '/api/admin/login', {
            username: 'admin',
            password: 'wrongpassword'
        }, {
            'x-csrf-token': csrfToken,
            'Cookie': `csrf_token=${csrfToken}`
        });
        if (test6.status === 401) {
            console.log('✅ Test 6 Passed: Denied admin access for wrong password.');
        } else {
            throw new Error(`Test 6 Failed: Expected 401, got ${test6.status}`);
        }

        // Test 7: Admin login with correct credentials
        console.log('\nTest 7: Admin login with correct credentials...');
        const test7 = await request('POST', '/api/admin/login', {
            username: 'admin',
            password: 'admin123'
        }, {
            'x-csrf-token': csrfToken,
            'Cookie': `csrf_token=${csrfToken}`
        });
        if (test7.status === 200) {
            console.log('✅ Test 7 Passed: Successfully logged in as admin.');
        } else {
            throw new Error(`Test 7 Failed: Expected 200, got ${test7.status}`);
        }

        const adminToken = extractCookie(test7.headers, 'admin_token');
        if (adminToken) {
            console.log(`✅ JWT token cookie retrieved: ${adminToken.substring(0, 30)}...`);
        } else {
            throw new Error('Test 7 Failed: admin_token cookie not returned.');
        }

        // Test 8: Access admin route with valid auth cookie
        console.log('\nTest 8: Accessing admin orders with valid auth cookie...');
        const test8 = await request('GET', '/api/orders', null, {
            'Cookie': `admin_token=${adminToken}`
        });
        if (test8.status === 200 && Array.isArray(test8.body)) {
            console.log('✅ Test 8 Passed: Successfully loaded orders using HTTP-only cookie.');
        } else {
            throw new Error(`Test 8 Failed: Expected 200, got ${test8.status}`);
        }

        console.log('\n🎉 ALL 8 AUTOMATED SECURITY TESTS PASSED SUCCESSFULLY! 🎉');

    } catch (err) {
        console.error('\n❌ SECURITY VERIFICATION TEST FAILED:', err.message);
    } finally {
        // Stop server process
        serverProcess.kill();
        console.log('\nTest server terminated.');
        process.exit(0);
    }
}, 2000); // Allow 2 seconds for server initialization
