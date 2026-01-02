const fs = require('fs');
const path = require('path');
require('dotenv').config();

const apiKey = process.env.PREMBLY_API_KEY;
const baseUrl = process.env.PREMBLY_BASE_URL || 'https://api.prembly.com';

console.log('--- Prembly Auth Debug (No AppID) ---');
console.log(`Base URL: ${baseUrl}`);

console.log(`Process.env API Key present: ${apiKey ? 'YES' : 'NO'}`);

if (!apiKey) {
    console.error('Missing API Key in process.env');
    process.exit(1);
} else {
    testAuth();
}

async function testAuth() {
    try {
        console.log('Testing auth against: ' + baseUrl + '/verification/vnin');
        console.log('Using Headers: x-api-key only (no app-id)');

        // Using dummy data
        const response = await fetch(baseUrl + '/verification/vnin', {
            method: 'POST',
            headers: {
                'x-api-key': apiKey,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ number_nin: '00000000000' })
        });

        const status = response.status;
        const text = await response.text();

        console.log(`HTTP Status: ${status}`);
        console.log(`Response Body: ${text.substring(0, 300)}`);

        if (status === 200) {
            console.log('SUCCESS: Auth passed and request processed.');
        } else if (status === 400 || status === 404 || status === 422) {
            console.log('SUCCESS: Auth likely passed (got logical error instead of 401/403).');
        } else {
            console.log('FAILURE: Still getting ' + status);
        }

    } catch (error) {
        console.error('Request failed:', error.message);
    }
}
