const { PrismaClient } = require('@prisma/client')
require('dotenv').config()
const prisma = new PrismaClient()

// Key provided by user
const PREMBLY_API_KEY = 'live_sk_6263dXD3nLGlzDVzrEewVOIwOVkCfOwq89EGHfAI7J';

async function updateKeysForProvider(providerName, category) {
    console.log(`Updating keys for provider: ${providerName} (${category})`);

    const provider = await prisma.serviceProvider.findFirst({
        where: {
            name: { equals: providerName, mode: 'insensitive' },
            category: { equals: category, mode: 'insensitive' }
        }
    })

    if (!provider) {
        console.error(`Provider not found: ${providerName}`);
        return;
    }

    console.log(`Found provider ID: ${provider.id}`);

    // Upsert API Key
    // We identify key by providerId + keyName

    await prisma.providerApiKey.deleteMany({
        where: {
            providerId: provider.id,
            keyName: 'api_key'
        }
    });

    await prisma.providerApiKey.create({
        data: {
            providerId: provider.id,
            keyName: 'api_key',
            keyValue: PREMBLY_API_KEY
        }
    });

    console.log(`-> Set 'api_key' to ${PREMBLY_API_KEY.substring(0, 5)}...`);

    // We do NOT set 'app_id' since it's optional and user wants to rely on just API Key
    // But let's check if there is an old app_id and remove it to be clean
    const deletedAppId = await prisma.providerApiKey.deleteMany({
        where: {
            providerId: provider.id,
            keyName: 'app_id'
        }
    });
    if (deletedAppId.count > 0) {
        console.log(`-> Removed old 'app_id' keys`);
    }
}

async function main() {
    // Update verification provider
    await updateKeysForProvider('Prembly - Verification', 'verification');

    // Also update specific ones if they exist as separate providers (based on my previous seed)
    await updateKeysForProvider('Prembly - NIN', 'nin');
    await updateKeysForProvider('Prembly - BVN', 'bvn');

    console.log('Key update complete.');
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
