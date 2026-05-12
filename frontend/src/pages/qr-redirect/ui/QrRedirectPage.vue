<script setup lang="ts">
import { onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/entities/user/model/authStore';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

onMounted(() => {
  const slug = route.params.slug as string;
  const dest = `/review/create/${slug}`;
  if (authStore.isAuthenticated && authStore.userRole === 'student') {
    router.replace(dest);
  } else {
    router.replace(`/login?redirect=${encodeURIComponent(dest)}`);
  }
});
</script>

<template>
  <div class="min-h-screen bg-[#0e0e10] flex items-center justify-center">
    <div class="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
  </div>
</template>
