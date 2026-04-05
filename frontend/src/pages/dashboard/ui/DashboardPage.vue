<script setup lang="ts">
import { computed } from 'vue';
import { useAuthStore } from '@/entities/user/model/authStore';
import ManagerDashboard from './ManagerDashboard.vue';
import StudentDashboard from './StudentDashboard.vue';

const authStore = useAuthStore();
const isManager = computed(() => authStore.userRole === 'manager' || authStore.userRole === 'admin');
</script>

<template>
  <ManagerDashboard v-if="isManager" />
  <StudentDashboard v-else />
</template>
