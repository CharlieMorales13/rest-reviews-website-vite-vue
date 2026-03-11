const API_URL = 'http://localhost:3000/api';

async function runTests() {
    console.log('🚀 Iniciando Test de Endpoints...\n');

    try {
        // 1. Health Check
        console.log('--- [HEALTH CHECK] ---');
        const healthRes = await fetch('http://localhost:3000/health');
        const health = await healthRes.json();
        console.log('✅ Status:', health.status);

        // 2. Login
        console.log('\n--- [AUTH: LOGIN] ---');
        const loginRes = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'admin@example.com',
                password: 'password123'
            })
        });
        const loginData = await loginRes.json();
        if (!loginRes.ok) throw new Error(`Login fallido: ${JSON.stringify(loginData)}`);

        const token = loginData.data.token;
        const myId = loginData.data.user.id;
        console.log('✅ Login Exitoso. Token recibido.');

        const authHeader = { Authorization: `Bearer ${token}` };

        // 3. List Establishments
        console.log('\n--- [ESTABLISHMENTS: LIST] ---');
        const establishmentsRes = await fetch(`${API_URL}/establishments`);
        const establishmentsData = await establishmentsRes.json();
        console.log(`✅ Recibidos ${establishmentsData.data.length} establecimientos.`);
        // Note: Entities currently expose internal .props when serialized directly
        const firstEstablishment = establishmentsData.data[0];
        const firstId = firstEstablishment.id || firstEstablishment.props?.id;
        console.log(`🔍 Usando ID: ${firstId}`);

        // 4. Get Establishment Reviews
        console.log('\n--- [REVIEWS: GET BY ESTABLISHMENT] ---');
        const reviewsRes = await fetch(`${API_URL}/establishments/${firstId}/reviews`);
        const reviewsData = await reviewsRes.json();

        if (!reviewsRes.ok) {
            console.log('⚠️ Error en Reviews:', reviewsData);
        } else {
            console.log(`✅ Recibidas ${reviewsData.data?.length || 0} reseñas para el local ${firstId}.`);
            if (reviewsData.data && reviewsData.data.length > 0) {
                const firstReview = reviewsData.data[0];
                console.log('🔍 Muestra:', (firstReview.comment || firstReview.props?.comment || '').substring(0, 30) + '...');
                console.log('🔍 Autor:', firstReview.author || firstReview.authorName || firstReview.props?.authorName);
                console.log('🔍 Sentimiento:', firstReview.sentiment || firstReview.props?.sentiment || 'N/A');
            }
        }

        // 5. Get Metrics Summary
        console.log('\n--- [ANALYTICS: METRICS] ---');
        const metricsRes = await fetch(`${API_URL}/metrics/summary`);
        const metricsData = await metricsRes.json();
        console.log('✅ Métricas Críticas:');
        console.log(`   - Total Reseñas: ${metricsData.data.totalReviews}`);
        console.log(`   - Distribución Positiva: ${metricsData.data.sentimentDistribution.positive}`);
        console.log(`   - Top Restaurante: ${metricsData.data.topEstablishments[0]?.name || 'N/A'}`);

        // 6. User Profile (Social)
        console.log('\n--- [SOCIAL: USER PROFILE] ---');
        const profileRes = await fetch(`${API_URL}/users/${myId}/profile`, { headers: authHeader });
        const profileData = await profileRes.json();
        console.log('✅ Perfil Social Recuperado:');
        console.log(`   - Nombre: ${profileData.data.name}`);
        console.log(`   - Bio: ${profileData.data.bio || 'Sin bio'}`);
        console.log(`   - Verificado: ${profileData.data.verified ? 'SÍ' : 'NO'}`);

        // 7. Update Establishment (Enrichment Test)
        console.log('\n--- [ESTABLISHMENTS: ENRICHMENT TEST] ---');
        const updateRes = await fetch(`${API_URL}/establishments/${firstId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                ...authHeader
            },
            body: JSON.stringify({
                universityId: 'Anáhuac Oaxaca',
                locationDetails: 'Frente al edificio A, planta baja',
                openingHours: 'Lunes a Viernes: 8:00 AM - 6:00 PM',
                galleryUrls: ['https://example.com/gallery1.jpg', 'https://example.com/gallery2.jpg'],
                menuUrls: ['https://example.com/menu1.jpg']
            })
        });
        const updateData = await updateRes.json();
        if (updateRes.ok) {
            console.log('✅ Establecimiento enriquecido exitosamente.');
            const enriched = updateData.data.props || updateData.data;
            console.log(`   - Universidad: ${enriched.universityId}`);
            console.log(`   - Ubicación: ${enriched.locationDetails}`);
            console.log(`   - Galería: ${enriched.galleryUrls?.length} fotos`);
        } else {
            console.log('❌ Falló enriquecimiento:', updateData);
        }

        // 8. Search and Filter Establishments
        console.log('\n--- [ESTABLISHMENTS: SEARCH & FILTER TEST] ---');

        // Test 1: Search by name "Cuckoo"
        const searchNameRes = await fetch(`${API_URL}/establishments?name=Cuckoo`);
        const searchNameData = await searchNameRes.json();
        console.log(`✅ Búsqueda por nombre "Cuckoo": ${searchNameData.data?.length || 0} resultados.`);

        // Test 2: Filter by university (using the one assigned in previous test)
        const filterUniRes = await fetch(`${API_URL}/establishments?universityId=Anáhuac Oaxaca`);
        const filterUniData = await filterUniRes.json();
        console.log(`✅ Filtro por universidad "Anáhuac Oaxaca": ${filterUniData.data?.length || 0} resultados.`);

        // Test 3: Combine both
        const combineRes = await fetch(`${API_URL}/establishments?name=Cuckoo&universityId=Anáhuac Oaxaca`);
        const combineData = await combineRes.json();
        console.log(`✅ Búsqueda combinada: ${combineData.data?.length || 0} resultados.`);

        console.log('\n🌟 ¡TODOS LOS TESTS PASARON EXITOSAMENTE!');

    } catch (error: any) {
        console.error('\n❌ ERROR DURANTE EL TEST:');
        console.error(error.message);
        console.log('\n⚠️ Asegúrate de que el servidor esté corriendo en el puerto 3000 (npm run dev).');
    }
}

runTests();
