<script setup lang="ts">
import { useFilterEstablishments } from '@/features/filter-establishments/model/useFilterEstablishments';
import EstablishmentsTable from '@/widgets/establishments-table/ui/EstablishmentsTable.vue';
import type { Establishment } from '@/entities/establishment/model/Establishment';

const rawEstablishments: Establishment[] = [
  { nombre: 'Cucko', categoria: 'Restaurante', calificacion: 4.5 },
  { nombre: 'Cucko Box', categoria: 'Snacks', calificacion: 3.9 },
  { nombre: 'Oaxaqueñito', categoria: 'Restaurante', calificacion: 4.8 },
  { nombre: 'Delly Food', categoria: 'Comida Orgánica', calificacion: 4.2 },
];

const { busqueda, listaFiltrada } = useFilterEstablishments(rawEstablishments);
</script>

<template>
  <div>
    <input
      type="text"
      v-model="busqueda"
      placeholder="🔍 Buscar establecimiento..."
      style="width:100%; padding:10px; border-radius:8px; border:1px solid #ddd; margin-bottom:20px; box-sizing:border-box;"
    />
    <EstablishmentsTable :items="listaFiltrada" />
  </div>
</template>
