const { PrismaClient } = require('@prisma/client');
require('dotenv').config();
const prisma = new PrismaClient();

async function main() {
    // Get seeded key
    const provider = await prisma.serviceProvider.findFirst({
        where: { name: { contains: 'Prembly', mode: 'insensitive' }, category: 'verification' },
        include: { apiKeys: true }
    });

    const apiKey = provider?.apiKeys.find(k => k.keyName === 'api_key')?.keyValue;
    if (!apiKey) {
        console.error("No API key found in DB!");
        return;
    }

    console.log(`Using API Key: ${apiKey.substring(0, 8)}...`);

    // URL and payload
    const url = "https://api.prembly.com/verification/nin";
    const payload = {
        number_nin: "12345678901",
        number: "12345678901"
    };

    console.log(`Sending payload to ${url}:`, payload);

    // Use native fetch
    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
        },
        body: JSON.stringify(payload)
    });

    const text = await res.text();
    console.log("\n--- RAW RESPONSE ---");
    console.log(text);
    console.log("--------------------\n");
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
