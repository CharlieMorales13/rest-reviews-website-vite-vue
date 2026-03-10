import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const establishments = ['Chilli', 'Cucko', 'Delly']
  
  for (const name of establishments) {
    await prisma.establishment.upsert({
      where: { id: name }, // Nota: si tu id es UUID, usa create
      update: {},
      create: { name }
    })
  }
  console.log('Restaurantes creados correctamente')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
