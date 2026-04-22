<script setup lang="ts">
import { useAuthStore } from '@/entities/user/model/authStore';
import { onMounted } from 'vue';
import AppToast from '@/shared/ui/AppToast.vue';

const authStore = useAuthStore();

onMounted(() => {
  authStore.initAuth();
});
</script>

<template>
  <router-view />
  <AppToast />
</template>

