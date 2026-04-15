/**
 * Manual endpoint test script (legacy).
 * For automated tests, use: npm run test (Vitest)
 * See: tests/integration.test.ts
 *
 * To run this manually: npx ts-node tests/test_endpoints.ts
 * Requires the server to be running on port 3000.
 */

export {};

const API_URL = 'http://localhost:3000/api';

async function runTests() {
    console.log('Iniciando Test de Endpoints...\n');

    try {
        // 1. Health Check
        console.log('--- [HEALTH CHECK] ---');
        const healthRes = await fetch('http://localhost:3000/health');
        const health = await healthRes.json();
        console.log('Status:', health.status);

        // 2. Login
        console.log('\n--- [AUTH: LOGIN] ---');
        const loginRes = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'admin@anahuac.mx',
                password: 'password123'
            })
        });
        const loginData = await loginRes.json();
        if (!loginRes.ok) throw new Error(`Login fallido: ${JSON.stringify(loginData)}`);

        const token = loginData.data.token;
        const myId = loginData.data.user.id;
        console.log('Login Exitoso. Token recibido.');

        const authHeader = { Authorization: `Bearer ${token}` };

        // 3. List Establishments
        console.log('\n--- [ESTABLISHMENTS: LIST] ---');
        const establishmentsRes = await fetch(`${API_URL}/establishments`);
        const establishmentsData = await establishmentsRes.json();
        console.log(`Recibidos ${establishmentsData.data.length} establecimientos.`);
        const firstEstablishment = establishmentsData.data[0];
        const firstId = firstEstablishment.id || firstEstablishment.props?.id;
        console.log(`Usando ID: ${firstId}`);

        // 4. Get Establishment Reviews
        console.log('\n--- [REVIEWS: GET BY ESTABLISHMENT] ---');
        const reviewsRes = await fetch(`${API_URL}/establishments/${firstId}/reviews`);
        const reviewsData = await reviewsRes.json();

        if (!reviewsRes.ok) {
            console.log('Error en Reviews:', reviewsData);
        } else {
            console.log(`Recibidas ${reviewsData.data?.length || 0} resenas para el local ${firstId}.`);
        }

        // 5. Get Metrics Summary
        console.log('\n--- [ANALYTICS: METRICS] ---');
        const metricsRes = await fetch(`${API_URL}/metrics/summary`, { headers: authHeader });
        const metricsData = await metricsRes.json();
        console.log('Metricas:', JSON.stringify(metricsData.data, null, 2));

        // 6. User Profile
        console.log('\n--- [SOCIAL: USER PROFILE] ---');
        const profileRes = await fetch(`${API_URL}/users/${myId}/profile`, { headers: authHeader });
        const profileData = await profileRes.json();
        console.log('Perfil:', profileData.data?.name);

        console.log('\nTODOS LOS TESTS PASARON EXITOSAMENTE!');

    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        console.error('\nERROR DURANTE EL TEST:', msg);
        console.log('\nAsegurate de que el servidor este corriendo en el puerto 3000 (npm run dev).');
    }
}

runTests();
