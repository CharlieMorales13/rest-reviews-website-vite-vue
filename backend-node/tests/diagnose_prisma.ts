import prisma from '../src/infrastructure/database/prisma.service';

async function diagnose() {
    const id = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b21'; // DelyFull
    console.log(`🔍 Buscando establecimiento con ID: ${id}`);

    try {
        const establishment = await prisma.establishment.findUnique({
            where: { id }
        });
        console.log('✅ Resultado:', establishment ? establishment.name : 'No encontrado');
    } catch (error: any) {
        console.error('❌ Error en findUnique:');
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

diagnose();
