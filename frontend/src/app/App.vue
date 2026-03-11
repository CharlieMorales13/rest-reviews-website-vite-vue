<script setup lang="ts">
import { ref } from 'vue';
import AppSidebar from '@/widgets/app-sidebar/ui/AppSidebar.vue';
import HomePage from '@/pages/home/ui/HomePage.vue';
import EstablishmentsPage from '@/pages/establishments/ui/EstablishmentsPage.vue';
import type { User } from '@/entities/user/model/User';

type Vista = 'inicio' | 'lugares';
const vista = ref<Vista>('inicio');

const usuario: User = {
  nombre: 'Sebastián Morales',
  id: '00458921',
  carrera: 'Ing. en Tecnologías de la Información',
  semestre: '6to Semestre',
  rol: localStorage.getItem('user_rol') || 'Estudiante',
};

function cambiarVista(v: string) {
  vista.value = v as Vista;
}

function salir() {
  localStorage.removeItem('user_rol');
  window.location.href = 'login.html';
}
</script>

<template>
  <div class="contenedor-app">
    <AppSidebar
      :usuario="usuario"
      :vistaActual="vista"
      @cambiarVista="cambiarVista"
      @salir="salir"
    />

    <main class="main-content">
      <header style="margin-bottom: 30px;">
        <h1 style="margin:0;">
          {{ vista === 'inicio' ? 'Resumen General' : 'Establecimientos Universitarios' }}
        </h1>
        <span style="background:#dcfce7; color:#166534; padding:4px 12px; border-radius:20px; font-size:0.8em;">
          Sesión Activa
        </span>
      </header>

      <HomePage v-if="vista === 'inicio'" />
      <EstablishmentsPage v-else-if="vista === 'lugares'" />
    </main>
  </div>
</template>

<style>
@import '../shared/assets/css/main.css';
</style>
