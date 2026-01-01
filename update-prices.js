const { PrismaClient } = require('@prisma/client');
require('dotenv').config();
const prisma = new PrismaClient();

async function upsertPrice({
    category,
    subservice,
    variant,
    params = {},
    basePrice,
    userPrice,
    marketerPrice,
}) {
    const paramsKey = Object.keys(params).sort().map(k => `${k}=${params[k]}`).join('|');

    console.log(`Updating ${category}/${subservice}/${variant} [${paramsKey}]...`);

    await prisma.catalogPricing.upsert({
        where: {
            catalog_pricing_category_subservice_variant_paramsKey_unique: {
                category,
                subservice,
                variant,
                paramsKey,
            },
        },
        update: {
            basePrice,
            userPrice,
            marketerPrice,
            parameters: params,
            updatedBy: 'system-script',
        },
        create: {
            category,
            subservice,
            variant,
            paramsKey,
            parameters: params,
            basePrice,
            userPrice,
            marketerPrice,
            updatedBy: 'system-script',
        },
    });
}

async function main() {
    try {
        // 1. BVN Android License (Base 2000, User 5000, Marketer 3000)
        await upsertPrice({
            category: 'bvn',
            subservice: 'android-license',
            variant: 'enrollment',
            basePrice: 2000,
            userPrice: 5000,
            marketerPrice: 3000,
        });

        // 2. BVN Modification - Common Types (Base 3000, User 5000, Marketer 4000)
        const standardModifications = [
            'name_correction',
            'date_of_birth_correction',
            'phone_number_update',
            'gender_correction',
            'email_correction',
            'address_update'
        ];

        for (const modType of standardModifications) {
            await upsertPrice({
                category: 'bvn',
                subservice: 'modification',
                variant: 'basic',
                params: { modificationType: modType },
                basePrice: 3000,
                userPrice: 5000,
                marketerPrice: 4000,
            });
        }

        // Also update the fallback "basic" variant without params to the most common price
        // This serves as a default if exact param match fails (though our logic prefers exact matches)
        await upsertPrice({
            category: 'bvn',
            subservice: 'modification',
            variant: 'basic',
            params: {},
            basePrice: 3000,
            userPrice: 5000,
            marketerPrice: 4000,
        });


        // 3. BVN Modification - Others (Base 5000, User 8000, Marketer 6500)
        await upsertPrice({
            category: 'bvn',
            subservice: 'modification',
            variant: 'basic',
            params: { modificationType: 'others' },
            basePrice: 5000,
            userPrice: 8000,
            marketerPrice: 6500,
        });

        // 4. BVN Central Risk (Base 1000, User 2500, Marketer 2000)
        await upsertPrice({
            category: 'bvn',
            subservice: 'central-risk',
            variant: 'default',
            basePrice: 1000,
            userPrice: 2500,
            marketerPrice: 2000,
        });

        // Also add for central-risk aliases if needed, but 'default' variant usually covers it if subservice matches.
        // Given the route fallback logic, exact subservice match is prioritized.
        // The previous finding showed 'central-risk' page used "default" variant.

        console.log('All prices updated successfully.');
    } catch (error) {
        console.error('Error updating prices:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
