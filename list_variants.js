
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();
const prisma = new PrismaClient();

async function listVariants() {
    console.log("Listing BVN/NIN Modification Variants...");
    try {
        const bvnPrices = await prisma.catalogPricing.findMany({
            where: {
                category: 'bvn',
                subservice: 'modification'
            },
            select: { variant: true }
        });
        console.log("BVN Variants:", bvnPrices.map(p => p.variant));

        const ninPrices = await prisma.catalogPricing.findMany({
            where: {
                category: 'nin',
                subservice: 'modification'
            },
            select: { variant: true }
        });
        console.log("NIN Variants:", ninPrices.map(p => p.variant));

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

listVariants();
