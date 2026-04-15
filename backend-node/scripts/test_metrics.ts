/**
 * Manual metrics test script (legacy).
 * For automated tests, use: npm run test (Vitest)
 * See: tests/integration.test.ts
 *
 * To run this manually: npx ts-node tests/test_metrics.ts
 * Requires the server to be running on port 3000.
 */

async function testMetrics() {
    const API_URL = 'http://localhost:3000/api';
    console.log('Iniciando Test de Dashboard Analytics...');

    try {
        // 1. LOGIN
        console.log('\n--- [AUTH: LOGIN] ---');
        const loginRes = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'admin@anahuac.mx',
                password: 'password123'
            })
        });
        const loginData: Record<string, unknown> = await loginRes.json() as Record<string, unknown>;
        if (!loginRes.ok) throw new Error('Login fallido');
        const data = loginData.data as Record<string, unknown>;
        const token = data.token as string;
        console.log('Login Exitoso.');

        // 2. GET SUMMARY
        console.log('\n--- [METRICS: GET SUMMARY] ---');
        const summaryRes = await fetch(`${API_URL}/metrics/summary`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const summaryData: Record<string, unknown> = await summaryRes.json() as Record<string, unknown>;
        console.log('Resumen global obtenido:', JSON.stringify(summaryData, null, 2));

        // 3. GET HISTORY
        const summaryInner = summaryData.data as Record<string, unknown>;
        const topEstablishments = summaryInner.topEstablishments as Array<Record<string, unknown>>;
        const estId = topEstablishments?.[0]?.id;
        if (estId) {
            console.log(`\n--- [METRICS: GET HISTORY FOR ${estId}] ---`);
            const historyRes = await fetch(`${API_URL}/metrics/establishment/${estId}/history?days=30`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const historyData: Record<string, unknown> = await historyRes.json() as Record<string, unknown>;

            if (historyRes.ok) {
                console.log('Historial obtenido con exito.');
            } else {
                const msg = (historyData as Record<string, unknown>).message;
                console.error('Error al obtener historial:', msg);
            }
        } else {
            console.warn('No se encontraron establecimientos para probar el historial.');
        }

        console.log('\nTEST DE METRICAS FINALIZADO!');

    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        console.error('\nERROR DURANTE EL TEST:', msg);
    }
}

testMetrics();
