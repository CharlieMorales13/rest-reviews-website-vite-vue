<script setup lang="ts">
import { useAuthStore } from '@/entities/user/model/authStore';
import { onMounted } from 'vue';

const authStore = useAuthStore();

onMounted(() => {
  authStore.initAuth();
});
</script>

<template>
  <router-view />
</template>

