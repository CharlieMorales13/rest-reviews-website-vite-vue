/**
 * Manual RBAC test script (legacy).
 * For automated tests, use: npm run test (Vitest)
 * See: tests/integration.test.ts
 *
 * To run this manually: npx ts-node tests/test_rbac.ts
 * Requires the server to be running on port 3000.
 */

export {};

const API_URL = 'http://localhost:3000/api';

async function testRBAC() {
    console.log('Iniciando Verificacion de RBAC...');

    try {
        // 1. Login as Student
        console.log('\n--- [AUTH: LOGIN COMO ESTUDIANTE] ---');
        const loginRes = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'estudiante@anahuac.mx',
                password: 'password123'
            })
        });
        const loginData = await loginRes.json();
        const studentToken = loginData.data?.token;

        if (!studentToken) {
            console.log('Error: No se pudo obtener el token de estudiante.');
            return;
        }
        console.log('Login de estudiante exitoso.');

        // 2. Attempt to create establishment (Should be Forbidden 403)
        console.log('\n--- [PROTECCION: CREATE ESTABLISHMENT (RESTRICTED TO ADMIN)] ---');
        const createRes = await fetch(`${API_URL}/establishments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${studentToken}`
            },
            body: JSON.stringify({
                name: 'Hacker Corner',
                description: 'Unauthorized restaurant',
                category: 'Illegal'
            })
        });

        if (createRes.status === 403) {
            console.log('ACCESO DENEGADO (403): El estudiante no pudo crear el establecimiento. Middleware funcionando!');
        } else {
            const data = await createRes.json();
            console.log(`ERROR: El estudiante recibio status ${createRes.status}. Respuesta:`, data);
        }

        // 3. Attempt to list users (Should be Forbidden 403)
        console.log('\n--- [PROTECCION: LIST USERS (RESTRICTED TO ADMIN)] ---');
        const usersRes = await fetch(`${API_URL}/users`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${studentToken}`
            }
        });

        if (usersRes.status === 403) {
            console.log('ACCESO DENEGADO (403): El estudiante no pudo listar usuarios. Middleware funcionando!');
        } else {
            console.log(`ERROR: El estudiante recibio status ${usersRes.status}.`);
        }

    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        console.error('Error fatal en el test:', msg);
    }
}

testRBAC();
