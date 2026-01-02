const { PrismaClient } = require('@prisma/client');
require('dotenv').config();
const prisma = new PrismaClient();

const PRICING = [
    // BVN Modification (Cleaned up)
    {
        category: 'bvn',
        subservice: 'modification',
        variant: 'dob', // Date of Birth Correction
        basePrice: 5000,
        userPrice: 8000,
        marketerPrice: 6500,
        paramsKey: 'type=dob'
    },
    {
        category: 'bvn',
        subservice: 'modification',
        variant: 'name', // Name Correction
        basePrice: 3000,
        userPrice: 5000,
        marketerPrice: 4000,
        paramsKey: 'type=name'
    },
    {
        category: 'bvn',
        subservice: 'modification',
        variant: 'basic', // General/Other
        basePrice: 3000,
        userPrice: 5000,
        marketerPrice: 4000,
        paramsKey: 'type=basic'
    },

    // NIN Modification (Added 'create' per request)
    {
        category: 'nin',
        subservice: 'modification',
        variant: 'create', // Requested variant
        basePrice: 3000,
        userPrice: 5000,
        marketerPrice: 4000,
        paramsKey: 'type=create'
    },
    {
        category: 'nin',
        subservice: 'modification',
        variant: 'dob',
        basePrice: 15000,
        userPrice: 20000,
        marketerPrice: 18000,
        paramsKey: 'type=dob'
    },
    {
        category: 'nin',
        subservice: 'modification',
        variant: 'name',
        basePrice: 5000,
        userPrice: 8000,
        marketerPrice: 6500,
        paramsKey: 'type=name'
    }
];

async function main() {
    console.log("Cleaning up modification pricing...");

    // Delete existing modification pricing to remove duplicates
    await prisma.catalogPricing.deleteMany({
        where: {
            category: { in: ['bvn', 'nin'] },
            subservice: 'modification'
        }
    });

    console.log("Seeding new pricing...");

    for (const p of PRICING) {
        // Upsert equivalent (though we just deleted, upsert is safe)
        await prisma.catalogPricing.create({
            data: {
                category: p.category,
                subservice: p.subservice,
                variant: p.variant,
                basePrice: p.basePrice,
                userPrice: p.userPrice,
                marketerPrice: p.marketerPrice,
                paramsKey: p.paramsKey,
                parameters: { type: p.variant }
            }
        });
        console.log(`Created: ${p.category} -> ${p.subservice} -> ${p.variant}`);
    }

    // Ensure ServiceCatalog entries exist
    console.log("Updating Service Catalog...");
    for (const p of PRICING) {
        const exists = await prisma.serviceCatalog.findFirst({
            where: { category: p.category, subservice: p.subservice, variant: p.variant }
        });
        if (!exists) {
            await prisma.serviceCatalog.create({
                data: {
                    category: p.category,
                    subservice: p.subservice,
                    variant: p.variant,
                    description: `${p.category.toUpperCase()} ${p.subservice} (${p.variant})`,
                    parameters: { type: p.variant }
                }
            });
            console.log(`+ Catalog: ${p.category}/${p.subservice}/${p.variant}`);
        }
    }
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
