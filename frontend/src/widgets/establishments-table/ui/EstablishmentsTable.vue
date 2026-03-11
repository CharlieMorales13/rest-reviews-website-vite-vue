<script setup lang="ts">
import type { Establishment } from '@/entities/establishment/model/Establishment';

defineProps<{
  items: Establishment[];
}>();
</script>

<template>
  <div style="background:white; padding:25px; border-radius:15px;">
    <table style="width:100%; border-collapse:collapse;">
      <thead>
        <tr style="text-align:left; color:#64748b; border-bottom:2px solid #f1f5f9;">
          <th style="padding:12px;">Nombre</th>
          <th>Categoría</th>
          <th>Calificación</th>
          <th>Acción</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="lugar in items"
          :key="lugar.nombre"
          style="border-bottom:1px solid #f1f5f9;"
        >
          <td style="padding:15px;"><strong>{{ lugar.nombre }}</strong></td>
          <td>{{ lugar.categoria }}</td>
          <td>⭐ {{ lugar.calificacion }}</td>
          <td>
            <button style="background:var(--primary-color); color:white; border:none; padding:6px 12px; border-radius:6px; cursor:pointer;">
              Evaluar
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
