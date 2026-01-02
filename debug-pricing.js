const { PrismaClient } = require('@prisma/client');
require('dotenv').config();
const prisma = new PrismaClient();

async function main() {
    console.log("Checking Pricing Configurations for BVN and NIN...");

    const bvnPrices = await prisma.catalogPricing.findMany({
        where: { category: 'bvn' },
        orderBy: { subservice: 'asc' }
    });

    const ninPrices = await prisma.catalogPricing.findMany({
        where: { category: 'nin' },
        orderBy: { subservice: 'asc' }
    });

    console.log("\n--- BVN PRICING ---");
    if (bvnPrices.length === 0) console.log("No BVN prices found.");
    bvnPrices.forEach(p => {
        console.log(`[${p.subservice}] Variant: ${p.variant || 'default'} | Base: ${p.basePrice} | User: ${p.userPrice} | Marketer: ${p.marketerPrice}`);
    });

    console.log("\n--- NIN PRICING ---");
    if (ninPrices.length === 0) console.log("No NIN prices found.");
    ninPrices.forEach(p => {
        console.log(`[${p.subservice}] Variant: ${p.variant || 'default'} | Base: ${p.basePrice} | User: ${p.userPrice} | Marketer: ${p.marketerPrice}`);
    });
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
