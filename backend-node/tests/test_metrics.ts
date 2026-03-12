
async function testMetrics() {
    const API_URL = 'http://localhost:3000/api';
    console.log('🚀 Iniciando Test de Dashboard Analytics...');

    try {
        // 1. LOGIN
        console.log('\n--- [AUTH: LOGIN] ---');
        const loginRes = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'admin@example.com',
                password: 'password123'
            })
        });
        const loginData: any = await loginRes.json();
        if (!loginRes.ok) throw new Error('Login fallido');
        const token = loginData.data.token;
        console.log('✅ Login Exitoso.');

        // 2. GET SUMMARY
        console.log('\n--- [METRICS: GET SUMMARY] ---');
        const summaryRes = await fetch(`${API_URL}/metrics/summary`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const summaryData: any = await summaryRes.json();
        console.log('✅ Resumen global obtenido:', JSON.stringify(summaryData.data, null, 2));

        // 3. GET HISTORY (We use the first establishment found in summary)
        const estId = summaryData.data.topEstablishments[0]?.id;
        if (estId) {
            console.log(`\n--- [METRICS: GET HISTORY FOR ${estId}] ---`);
            const historyRes = await fetch(`${API_URL}/metrics/establishment/${estId}/history?days=30`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const historyData: any = await historyRes.json();

            if (historyRes.ok) {
                console.log('✅ Historial obtenido con éxito.');
                console.log(`📊 Puntos de datos: ${historyData.data.series.length}`);
                if (historyData.data.series.length > 0) {
                    console.log('📈 Último punto:', JSON.stringify(historyData.data.series[historyData.data.series.length - 1], null, 2));
                } else {
                    console.log('⚠️ No hay snapshots previos, el array está vacío (Correcto si no se ha corrido el seeder analítico).');
                }
            } else {
                console.error('❌ Error al obtener historial:', historyData.message);
            }
        } else {
            console.warn('⚠️ No se encontraron establecimientos para probar el historial.');
        }

        console.log('\n🌟 ¡TEST DE MÉTRICAS FINALIZADO!');

    } catch (error: any) {
        console.error('\n❌ ERROR DURANTE EL TEST:', error.message);
    }
}

testMetrics();
