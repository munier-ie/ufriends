
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();
const prisma = new PrismaClient();

async function checkPricing() {
    console.log("Checking for other default variants...");
    try {
        const pricings = await prisma.catalogPricing.findMany({
            where: {
                variant: 'default'
            }
        });

        console.log(`Found ${pricings.length} other entries with variant 'default':`);
        pricings.forEach(p => {
            console.log(`${p.category} / ${p.subservice} / ${p.variant}`);
        });

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

checkPricing();
