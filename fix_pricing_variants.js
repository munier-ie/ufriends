
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();
const prisma = new PrismaClient();

async function fixPricingVariants() {
    console.log("Fixing pricing variants for education...");
    try {
        // specific fix for education category where variant is 'default'
        const result = await prisma.catalogPricing.updateMany({
            where: {
                category: 'education',
                variant: 'default'
            },
            data: {
                variant: ''
            }
        });

        console.log(`Updated ${result.count} entries for education category.`);

        // Check if new entries look correct
        const pricings = await prisma.catalogPricing.findMany({
            where: {
                category: 'education'
            }
        });

        console.log(`Current entries for education:`);
        pricings.forEach(p => {
            console.log(`${p.category} / ${p.subservice} / '${p.variant}' : User=${p.userPrice}`);
        });

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

fixPricingVariants();
