const { PrismaClient } = require('@prisma/client');
require('dotenv').config();
const prisma = new PrismaClient();

// Full list of modification types to restore/add for parity
const VARIANTS = [
    { id: 'name', label: 'Name Correction', price: 5000, base: 3000, marketer: 4000 },
    { id: 'dob', label: 'Date of Birth Correction', price: 15000, base: 10000, marketer: 13000 },
    { id: 'phone', label: 'Phone Number Update', price: 3000, base: 1500, marketer: 2500 },
    { id: 'address', label: 'Address / LGA Update', price: 3500, base: 2000, marketer: 3000 },
    { id: 'email', label: 'Email Update', price: 2500, base: 1000, marketer: 2000 },
    { id: 'gender', label: 'Gender Correction', price: 4000, base: 2500, marketer: 3500 },
    { id: 'photo', label: 'Passport Photo Update', price: 4500, base: 3000, marketer: 4000 },
    { id: 'create', label: 'New Enrollment (Create)', price: 5000, base: 3000, marketer: 4000 }, // Requested specifically
    { id: 'rearrangement', label: 'Name Rearrangement', price: 4000, base: 2500, marketer: 3500 },
];

async function main() {
    console.log("Restoring full modification variants for BVN and NIN...");

    // 1. Clean up existing incomplete modification entries
    await prisma.catalogPricing.deleteMany({
        where: {
            category: { in: ['bvn', 'nin'] },
            subservice: 'modification'
        }
    });

    const categories = ['bvn', 'nin'];

    for (const cat of categories) {
        console.log(`\nProcessing ${cat.toUpperCase()} Modification...`);

        for (const v of VARIANTS) {
            // Create Pricing
            await prisma.catalogPricing.create({
                data: {
                    category: cat,
                    subservice: 'modification',
                    variant: v.id,
                    basePrice: v.base,
                    userPrice: v.price,
                    marketerPrice: v.marketer,
                    paramsKey: `type=${v.id}`,
                    parameters: { type: v.id, label: v.label }
                }
            });
            console.log(`-> Added Pricing: ${v.label} (${v.id})`);

            // Ensure Catalog Entry Exists
            const catEntry = await prisma.serviceCatalog.findFirst({
                where: { category: cat, subservice: 'modification', variant: v.id }
            });

            if (!catEntry) {
                await prisma.serviceCatalog.create({
                    data: {
                        category: cat,
                        subservice: 'modification',
                        variant: v.id,
                        description: `${cat.toUpperCase()} ${v.label}`,
                        parameters: { type: v.id }
                    }
                });
                console.log(`   + Created Catalog Description`);
            } else {
                // Update description just in case
                await prisma.serviceCatalog.update({
                    where: { id: catEntry.id },
                    data: { description: `${cat.toUpperCase()} ${v.label}` }
                });
            }
        }
    }
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
