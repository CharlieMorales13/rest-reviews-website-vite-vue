import { ref, computed } from 'vue';
import type { Establishment } from '@/entities/establishment/model/Establishment';

export function useFilterEstablishments(items: Establishment[]) {
    const busqueda = ref('');

    const listaFiltrada = computed(() =>
        items.filter(e =>
            e.nombre.toLowerCase().includes(busqueda.value.toLowerCase())
        )
    );

    return { busqueda, listaFiltrada };
}
