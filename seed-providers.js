const { PrismaClient } = require('@prisma/client')
require('dotenv').config()
const prisma = new PrismaClient()

async function upsertProvider({ name, category, adapter }) {
    console.log(`Upserting provider: ${name} [${category}]`)
    const config = { adapter }

    const existing = await prisma.serviceProvider.findFirst({
        where: {
            name: { equals: name, mode: 'insensitive' }
        }
    })

    // Note: We search by NAME primarily because NAME is unique.
    // If we find it, we check if category matches.

    if (existing) {
        if (existing.category.toLowerCase() === category.toLowerCase()) {
            await prisma.serviceProvider.update({
                where: { id: existing.id },
                data: { isActive: true, configJson: config }
            })
            console.log(`-> Updated/Activated existing ${existing.name}`)
        } else {
            console.log(`-> Name collision: ${name} exists for ${existing.category} but you requested ${category}.`)
            // If collision, we might want to skip or force rename? 
            // For this seed script, I assume unique names across categories.
        }
    } else {
        try {
            await prisma.serviceProvider.create({
                data: {
                    name,
                    category,
                    isActive: true,
                    priority: 10,
                    configJson: config
                }
            })
            console.log(`-> Created ${name}`)
        } catch (e) {
            console.error(`Error creating ${name}:`, e.message)
        }
    }
}

async function main() {
    console.log('--- Cleaning/Fixing Legacy Providers ---')
    const legacy = await prisma.serviceProvider.findFirst({ where: { name: 'Prembly' } })
    if (legacy) {
        const newName = `Prembly - ${legacy.category.charAt(0).toUpperCase() + legacy.category.slice(1)}`
        console.log(`Renaming legacy 'Prembly' [${legacy.category}] to '${newName}'`)
        await prisma.serviceProvider.update({ where: { id: legacy.id }, data: { name: newName } })
    }

    console.log('--- Seeding Providers ---')
    // Verification Service (NIN, etc)
    await upsertProvider({ name: 'Prembly - Verification', category: 'verification', adapter: 'prembly' })
    await upsertProvider({ name: 'Prembly - NIN', category: 'nin', adapter: 'prembly' })
    await upsertProvider({ name: 'Prembly - BVN', category: 'bvn', adapter: 'prembly' })

    // Airtime/Data/Bills usually SubAndGain
    await upsertProvider({ name: 'SubAndGain - Airtime', category: 'airtime', adapter: 'subandgain' })
    await upsertProvider({ name: 'SubAndGain - Data', category: 'data', adapter: 'subandgain' })
    await upsertProvider({ name: 'SubAndGain - Bills', category: 'bills', adapter: 'subandgain' })
    await upsertProvider({ name: 'SubAndGain - Education', category: 'education', adapter: 'subandgain' })

    console.log('Seeding complete.')
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
