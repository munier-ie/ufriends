
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();
const prisma = new PrismaClient();

async function upsertPrice({
    category,
    subservice,
    variant = '',
    params = {},
    basePrice,
    userPrice,
    marketerPrice,
}) {
    const paramsKey = Object.keys(params).sort().map(k => `${k}=${params[k]} `).join('|');

    console.log(`  ${category} /${subservice}/${variant || 'default'} [${paramsKey || 'no params'}] => Base: ${basePrice}, User: ${userPrice}, Marketer: ${marketerPrice} `);

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
        console.log('\n=== BVN SERVICES ===');

        // BVN Android License (User specified: Base 2000, User 5000, Marketer 3000)
        await upsertPrice({ category: 'bvn', subservice: 'android-license', variant: 'enrollment', basePrice: 2000, userPrice: 5000, marketerPrice: 3000 });

        // BVN Modification - Standard types (User specified: Base 3000, User 5000, Marketer 4000)
        const standardModifications = ['name_correction', 'date_of_birth_correction', 'phone_number_update', 'gender_correction', 'email_correction', 'address_update'];
        for (const modType of standardModifications) {
            await upsertPrice({ category: 'bvn', subservice: 'modification', variant: 'basic', params: { modificationType: modType }, basePrice: 3000, userPrice: 5000, marketerPrice: 4000 });
        }
        // Fallback for modification without specific type
        await upsertPrice({ category: 'bvn', subservice: 'modification', variant: 'basic', basePrice: 3000, userPrice: 5000, marketerPrice: 4000 });

        // BVN Modification - Others (User specified: Base 5000, User 8000, Marketer 6500)
        await upsertPrice({ category: 'bvn', subservice: 'modification', variant: 'basic', params: { modificationType: 'others' }, basePrice: 5000, userPrice: 8000, marketerPrice: 6500 });

        // BVN Central Risk (User specified: Base 1000, User 2500, Marketer 2000)
        await upsertPrice({ category: 'bvn', subservice: 'central-risk', variant: 'default', basePrice: 1000, userPrice: 2500, marketerPrice: 2000 });

        // BVN Printout & Retrieval
        await upsertPrice({ category: 'bvn', subservice: 'printout', variant: 'default', basePrice: 500, userPrice: 1000, marketerPrice: 800 });
        await upsertPrice({ category: 'bvn', subservice: 'retrieval', variant: 'phone', basePrice: 500, userPrice: 1000, marketerPrice: 800 });
        await upsertPrice({ category: 'bvn', subservice: 'retrieval', variant: 'bank', basePrice: 500, userPrice: 1000, marketerPrice: 800 });

        console.log('\n=== NIN SERVICES ===');
        await upsertPrice({ category: 'nin', subservice: 'slip', variant: 'default', basePrice: 500, userPrice: 1000, marketerPrice: 800 });
        await upsertPrice({ category: 'nin', subservice: 'printout', variant: 'default', basePrice: 500, userPrice: 1000, marketerPrice: 800 });
        await upsertPrice({ category: 'nin', subservice: 'modification', variant: 'default', basePrice: 3000, userPrice: 5000, marketerPrice: 4000 });
        await upsertPrice({ category: 'nin', subservice: 'validation', variant: 'default', basePrice: 300, userPrice: 500, marketerPrice: 400 });
        await upsertPrice({ category: 'nin', subservice: 'ipe-clearance', variant: 'default', basePrice: 2000, userPrice: 4000, marketerPrice: 3000 });

        console.log('\n=== CAC SERVICES ===');
        await upsertPrice({ category: 'cac', subservice: 'certification', variant: 'default', basePrice: 5000, userPrice: 10000, marketerPrice: 8000 });
        await upsertPrice({ category: 'cac', subservice: 'status-report', variant: 'default', basePrice: 3000, userPrice: 6000, marketerPrice: 5000 });
        await upsertPrice({ category: 'cac', subservice: 'registration', variant: 'default', basePrice: 15000, userPrice: 25000, marketerPrice: 20000 });
        await upsertPrice({ category: 'cac', subservice: 'post-incorporation', variant: 'default', basePrice: 5000, userPrice: 10000, marketerPrice: 8000 });
        await upsertPrice({ category: 'cac', subservice: 'jtb-tin', variant: 'default', basePrice: 5000, userPrice: 10000, marketerPrice: 8000 });

        console.log('\n=== VERIFICATION SERVICES ===');
        await upsertPrice({ category: 'verification', subservice: 'bvn', variant: 'default', basePrice: 100, userPrice: 200, marketerPrice: 150 });
        await upsertPrice({ category: 'verification', subservice: 'nin', variant: 'default', basePrice: 100, userPrice: 200, marketerPrice: 150 });
        await upsertPrice({ category: 'verification', subservice: 'passport', variant: 'default', basePrice: 100, userPrice: 200, marketerPrice: 150 });
        await upsertPrice({ category: 'verification', subservice: 'driver-license', variant: 'default', basePrice: 100, userPrice: 200, marketerPrice: 150 });
        await upsertPrice({ category: 'verification', subservice: 'voters-card', variant: 'default', basePrice: 100, userPrice: 200, marketerPrice: 150 });
        await upsertPrice({ category: 'verification', subservice: 'phone', variant: 'default', basePrice: 50, userPrice: 100, marketerPrice: 80 });
        await upsertPrice({ category: 'verification', subservice: 'tin', variant: 'default', basePrice: 100, userPrice: 200, marketerPrice: 150 });
        await upsertPrice({ category: 'verification', subservice: 'cac', variant: 'default', basePrice: 100, userPrice: 200, marketerPrice: 150 });
        await upsertPrice({ category: 'verification', subservice: 'plate-number', variant: 'default', basePrice: 100, userPrice: 200, marketerPrice: 150 });

        console.log('\n=== EDUCATION SERVICES ===');
        await upsertPrice({ category: 'education', subservice: 'waec', variant: 'default', basePrice: 3000, userPrice: 5000, marketerPrice: 4000 });
        await upsertPrice({ category: 'education', subservice: 'neco', variant: 'default', basePrice: 2500, userPrice: 4500, marketerPrice: 3500 });
        await upsertPrice({ category: 'education', subservice: 'nabteb', variant: 'default', basePrice: 2500, userPrice: 4500, marketerPrice: 3500 });
        await upsertPrice({ category: 'education', subservice: 'nbais', variant: 'default', basePrice: 2500, userPrice: 4500, marketerPrice: 3500 });
        await upsertPrice({ category: 'education', subservice: 'jamb', variant: 'default', basePrice: 2000, userPrice: 3500, marketerPrice: 3000 });
        await upsertPrice({ category: 'education', subservice: 'nysc', variant: 'default', basePrice: 3000, userPrice: 5000, marketerPrice: 4000 });

        console.log('\n=== BILLS SERVICES ===');
        await upsertPrice({ category: 'bills', subservice: 'electricity', variant: 'default', basePrice: 50, userPrice: 100, marketerPrice: 80 });
        await upsertPrice({ category: 'bills', subservice: 'cable', variant: 'default', basePrice: 50, userPrice: 100, marketerPrice: 80 });

        console.log('\n=== AIRTIME SERVICES ===');
        // VTU per network
        for (const network of ['mtn', 'airtel', 'glo', '9mobile']) {
            await upsertPrice({ category: 'airtime', subservice: 'vtu', variant: 'default', params: { network }, basePrice: 0, userPrice: 0, marketerPrice: 0 });
        }
        await upsertPrice({ category: 'airtime', subservice: 'airtime-2-cash', variant: 'default', basePrice: 0, userPrice: 50, marketerPrice: 30 });
        await upsertPrice({ category: 'airtime', subservice: 'share-n-sell', variant: 'default', basePrice: 0, userPrice: 50, marketerPrice: 30 });

        console.log('\n=== DATA SERVICES ===');
        for (const network of ['mtn', 'airtel', 'glo', '9mobile']) {
            await upsertPrice({ category: 'data', subservice: 'sme', variant: 'default', params: { network }, basePrice: 0, userPrice: 0, marketerPrice: 0 });
            await upsertPrice({ category: 'data', subservice: 'gift', variant: 'default', params: { network }, basePrice: 0, userPrice: 0, marketerPrice: 0 });
            await upsertPrice({ category: 'data', subservice: 'corporate', variant: 'default', params: { network }, basePrice: 0, userPrice: 0, marketerPrice: 0 });
        }

        console.log('\n=== SOFTWARE DEVELOPMENT ===');
        await upsertPrice({ category: 'software-development', subservice: 'web', variant: 'default', basePrice: 50000, userPrice: 100000, marketerPrice: 80000 });
        await upsertPrice({ category: 'software-development', subservice: 'mobile', variant: 'default', basePrice: 80000, userPrice: 150000, marketerPrice: 120000 });
        await upsertPrice({ category: 'software-development', subservice: 'custom', variant: 'default', basePrice: 100000, userPrice: 200000, marketerPrice: 150000 });

        console.log('\n=== TRAINING ===');
        await upsertPrice({ category: 'training', subservice: 'bvn-modification', variant: 'default', basePrice: 5000, userPrice: 10000, marketerPrice: 8000 });
        await upsertPrice({ category: 'training', subservice: 'nin-modification', variant: 'default', basePrice: 5000, userPrice: 10000, marketerPrice: 8000 });
        await upsertPrice({ category: 'training', subservice: 'cac-registration', variant: 'default', basePrice: 10000, userPrice: 20000, marketerPrice: 15000 });
        await upsertPrice({ category: 'training', subservice: 'free-user', variant: 'default', basePrice: 0, userPrice: 0, marketerPrice: 0 });
        await upsertPrice({ category: 'training', subservice: 'premium-user', variant: 'default', basePrice: 5000, userPrice: 10000, marketerPrice: 8000 });
        await upsertPrice({ category: 'training', subservice: 'agency-updates', variant: 'default', basePrice: 0, userPrice: 0, marketerPrice: 0 });

        console.log('\n✅ All prices updated successfully!');
        console.log('You can verify in Prisma Studio or via the Admin Pricing page.\n');
    } catch (error) {
        console.error('❌ Error updating prices:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
