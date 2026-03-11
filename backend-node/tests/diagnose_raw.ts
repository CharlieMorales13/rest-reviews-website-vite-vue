import prisma from '../src/infrastructure/database/prisma.service';

async function diagnoseRaw() {
    const id = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b21'; // DelyFull
    console.log(`🔍 Buscando RAW con ID: ${id}`);

    try {
        const result = await prisma.$queryRaw`SELECT * FROM reviews WHERE establishment_id = ${id}::uuid`;
        console.log('✅ Resultado RAW:', result);
    } catch (error: any) {
        console.error('❌ Error en queryRaw:');
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

diagnoseRaw();
