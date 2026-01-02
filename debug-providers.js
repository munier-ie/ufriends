const { PrismaClient } = require('@prisma/client')
require('dotenv').config()
const prisma = new PrismaClient()

async function main() {
    const providers = await prisma.serviceProvider.findMany({
        select: {
            id: true,
            name: true,
            category: true,
            isActive: true,
            priority: true,
            apiKeys: true
        }
    })

    console.log('--- Service Providers ---')
    if (providers.length === 0) {
        console.log('No providers found in DB.')
    } else {
        providers.forEach(p => {
            console.log(`[${p.isActive ? 'ACTIVE' : 'INACTIVE'}] ${p.name} (Category: ${p.category})`)
            console.log(`  ID: ${p.id}`)
            console.log(`  Keys: ${p.apiKeys.map(k => k.keyName).join(', ')}`)
        })
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
