const { createApp, ref, onMounted, nextTick, watch, computed } = Vue;

createApp({
    setup() {
        const miRol = ref(localStorage.getItem('user_rol') || 'Estudiante');
        const vista = ref('inicio');
        const busqueda = ref('');
        let chart = null;

        const usuario = ref({
            nombre: 'Sebastián Morales',
            id: '00458921',
            carrera: 'Ing. en Tecnologías de la Información',
            semestre: '6to Semestre'
        });

        const titulos = {
            inicio: 'Resumen General',
            lugares: 'Establecimientos Universitarios'
        };

        const establecimientos = ref([
            { nombre: 'Cucko', categoria: 'Restaurante', calificacion: 4.5 },
            { nombre: 'Cucko Box', categoria: 'Snacks', calificacion: 3.9 },
            { nombre: 'Oaxaqueñito', categoria: 'Restaurante', calificacion: 4.8 },
            { nombre: 'Delly Food', categoria: 'Comida Orgánica', calificacion: 4.2 }
        ]);

        const listaFiltrada = computed(() => {
            return establecimientos.value.filter(e =>
                e.nombre.toLowerCase().includes(busqueda.value.toLowerCase())
            );
        });

        const cargarGrafica = () => {
            const ctx = document.getElementById('graficaSentimientos');
            if (!ctx) return;
            if (chart) chart.destroy();
            chart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['Positivas', 'Neutrales', 'Negativas'],
                    datasets: [{
                        data: [70, 20, 10],
                        backgroundColor: ['#10b981', '#facc15', '#ef4444']
                    }]
                },
                options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
            });
        };

        const salir = () => {
            localStorage.removeItem('user_rol');
            window.location.href = 'login.html';
        };

        watch(vista, async (v) => {
            if (v === 'inicio') { await nextTick(); cargarGrafica(); }
        });

        onMounted(() => {
            if (!localStorage.getItem('user_rol')) window.location.href = 'login.html';
            if (vista.value === 'inicio') cargarGrafica();
        });

        return { miRol, vista, titulos, busqueda, listaFiltrada, salir, usuario };
    }
}).mount('#app');