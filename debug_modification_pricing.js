
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();
const prisma = new PrismaClient();

async function checkModificationPricing() {
    console.log("Checking BVN/NIN Modification Pricing...");
    try {
        const bvnPrices = await prisma.catalogPricing.findMany({
            where: {
                category: 'bvn',
                subservice: 'modification'
            }
        });
        console.log(`Found ${bvnPrices.length} BVN modification entries:`);
        bvnPrices.forEach(p => console.log(JSON.stringify(p, null, 2)));

        const ninPrices = await prisma.catalogPricing.findMany({
            where: {
                category: 'nin',
                subservice: 'modification'
            }
        });
        console.log(`Found ${ninPrices.length} NIN modification entries:`);
        ninPrices.forEach(p => console.log(JSON.stringify(p, null, 2)));

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

checkModificationPricing();
