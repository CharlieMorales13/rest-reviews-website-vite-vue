async function testStorageFlow() {
    console.log('🚀 Iniciando Test de Flujo de Almacenamiento (Supabase)...\n');

    try {
        // 1. Login to get token
        console.log('--- [AUTH: LOGIN] ---');
        const loginRes = await fetch(`http://localhost:3000/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'admin@example.com',
                password: 'password123'
            })
        });
        const loginData = await loginRes.json();
        console.log('🔍 Login response status:', loginRes.status);
        console.log('🔍 Login response data:', JSON.stringify(loginData, null, 2));

        if (!loginRes.ok || !loginData.data) {
            throw new Error(`Login fallido: ${JSON.stringify(loginData)}`);
        }

        const token = loginData.data.token;
        const myId = loginData.data.user.id;
        console.log('✅ Login Exitoso.');

        const authHeader = { Authorization: `Bearer ${token}` };

        // 2. Upload an image (simulated)
        console.log('\n--- [UPLOAD: TEST IMAGE] ---');
        // We'll use a small buffer as a fake image for testing if no file exists
        const fakeImageBuffer = Buffer.from('fake-image-content');
        const formData = new FormData();

        // In Node fetch, we can use Blob for file upload
        const blob = new Blob([fakeImageBuffer], { type: 'image/png' });
        formData.append('file', blob, 'test-image.png');
        formData.append('bucket', 'reviews-app-bucket');

        const uploadRes = await fetch(`http://localhost:3000/api/upload`, {
            method: 'POST',
            headers: authHeader,
            body: formData
        });

        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(`Upload fallido: ${JSON.stringify(uploadData)}`);

        const publicUrl = uploadData.data.url;
        console.log('✅ Imagen subida exitosamente:', publicUrl);

        // 3. Update User Profile with the new Image URL
        console.log('\n--- [USER: UPDATE PROFILE WITH AVATAR] ---');
        const updateProfileRes = await fetch(`http://localhost:3000/api/auth/me`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                ...authHeader
            },
            body: JSON.stringify({
                avatarUrl: publicUrl,
                bio: 'Desarrollador de software y entusiasta de la comida universitaria.',
                universityId: 'Anáhuac Oaxaca'
            })
        });

        const profileUpdateData = await updateProfileRes.json();
        if (!updateProfileRes.ok) throw new Error(`Actualización de perfil fallida: ${JSON.stringify(profileUpdateData)}`);
        console.log('✅ Perfil actualizado con avatar.');

        // 4. Verify in Public Profile
        console.log('\n--- [SOCIAL: VERIFY PUBLIC PROFILE] ---');
        const publicProfileRes = await fetch(`http://localhost:3000/api/users/${myId}/profile`, { headers: authHeader });
        const publicProfileData = await publicProfileRes.json();

        console.log('🔍 Datos recuperados:');
        console.log(`   - Avatar: ${publicProfileData.data.avatarUrl}`);
        console.log(`   - Bio: ${publicProfileData.data.bio}`);

        if (publicProfileData.data.avatarUrl === publicUrl) {
            console.log('\n🌟 ¡TEST DE FLUJO DE ALMACENAMIENTO COMPLETADO CON ÉXITO!');
        } else {
            console.log('\n❌ ERROR: El avatar no coincide con la URL subida.');
        }

    } catch (error: any) {
        console.error('\n❌ ERROR DURANTE EL TEST:');
        console.error(error.message);
    }
}

testStorageFlow();
