<script setup lang="ts">
import type { User } from '@/entities/user/model/User';

defineProps<{
  usuario: User;
  vistaActual: string;
}>();

const emit = defineEmits<{
  (e: 'cambiarVista', vista: string): void;
  (e: 'salir'): void;
}>();
</script>

<template>
  <nav class="sidebar">
    <div style="padding: 25px 20px; border-bottom: 1px solid #334155;">
      <h3 style="margin:0;">U. Anáhuac</h3>
      <small style="color: #94a3b8;">Módulo de Analítica</small>
    </div>

    <div class="nav-menu">
      <div
        class="nav-item"
        :class="{ active: vistaActual === 'inicio' }"
        @click="emit('cambiarVista', 'inicio')"
      >🏠 Inicio</div>
      <div
        class="nav-item"
        :class="{ active: vistaActual === 'lugares' }"
        @click="emit('cambiarVista', 'lugares')"
      >🍴 Establecimientos</div>
    </div>

    <div class="sidebar-user-info">
      <div style="width:35px; height:35px; background:var(--primary-color); border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:bold;">
        {{ usuario.nombre.slice(0, 2).toUpperCase() }}
      </div>
      <div style="overflow:hidden;">
        <div style="font-size:0.85em; font-weight:bold; white-space:nowrap; text-overflow:ellipsis;">{{ usuario.nombre }}</div>
        <div style="font-size:0.7em; color:#94a3b8;">{{ usuario.rol }} - {{ usuario.semestre }}</div>
      </div>
    </div>

    <div class="nav-item" @click="emit('salir')" style="color:#ef4444; border-top:1px solid #334155;">
      🚪 Cerrar Sesión
    </div>
  </nav>
</template>
