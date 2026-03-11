<script setup lang="ts">
import { useAuthStore } from './application/stores/useAuthStore';
import { onMounted } from 'vue';

const authStore = useAuthStore();

onMounted(() => {
  authStore.initAuth();
});
</script>

<template>
  <router-view />
</template>

<style>
/* Global styles are imported in main.ts */
</style>