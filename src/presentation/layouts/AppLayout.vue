<script setup lang="ts">
import { computed } from 'vue';
import { useAuthStore } from '../../application/stores/useAuthStore';
import { useRoute, useRouter } from 'vue-router';

const authStore = useAuthStore();
const router = useRouter();
const route = useRoute();

const userName = computed(() => authStore.user?.name || 'Usuario');
const userInitials = computed(() => {
  const nameParts = userName.value.split(' ');
  if (nameParts.length >= 2) return nameParts[0][0] + nameParts[1][0];
  return nameParts[0].substring(0, 2).toUpperCase();
});
const userRole = computed(() => {
  if (authStore.userRole === 'student') return 'ITND - 6to Sem.';
  return authStore.userRole?.toUpperCase() || 'USUARIO';
});

const logout = () => {
  authStore.logout();
  router.push('/login');
};
</script>

<template>
  <div class="layout-container">
    <nav class="sidebar glass-panel">
      <div class="sidebar-header">
        <h3>U. Anáhuac</h3>
        <small class="subtitle">Módulo de Analítica</small>
      </div>
      
      <div class="nav-menu">
        <router-link 
          to="/dashboard" 
          class="nav-item" 
          :class="{ active: route.path.includes('/dashboard') }"
        >
          🏠 Inicio
        </router-link>
        <router-link 
          to="/establishments" 
          class="nav-item" 
          :class="{ active: route.path.includes('/establishments') || route.path.includes('/review') }"
        >
          🍴 Establecimientos
        </router-link>
      </div>

      <div class="sidebar-user-info">
        <div class="user-avatar">{{ userInitials }}</div>
        <div class="user-details">
          <div class="user-name">{{ userName }}</div>
          <div class="user-meta">{{ userRole }}</div>
        </div>
      </div>
      
      <div class="nav-item logout-btn" @click="logout">
        🚪 Cerrar Sesión
      </div>
    </nav>

    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<style scoped>
.layout-container {
  display: flex;
  min-height: 100vh;
}

.sidebar {
  width: 250px;
  display: flex;
  flex-direction: column;
  margin: 1rem;
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.sidebar-header {
  padding: 1.5rem;
  border-bottom: 1px solid var(--surface-border);
}

.sidebar-header h3 {
  margin: 0;
  color: var(--primary-color);
}

.subtitle {
  color: var(--text-secondary);
}

.nav-menu {
  flex: 1;
  padding: 1rem 0;
}

.nav-item {
  display: block;
  padding: 1rem 1.5rem;
  color: var(--text-secondary);
  text-decoration: none;
  transition: all 0.3s ease;
  cursor: pointer;
  border-left: 4px solid transparent;
}

.nav-item:hover, .nav-item.active {
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-primary);
  border-left-color: var(--primary-color);
}

.sidebar-user-info {
  display: flex;
  align-items: center;
  padding: 1.5rem;
  gap: 1rem;
  background: rgba(0, 0, 0, 0.2);
}

.user-avatar {
  width: 35px;
  height: 35px;
  background: var(--primary-color);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  color: #000;
}

.user-details {
  overflow: hidden;
}

.user-name {
  font-size: 0.85em;
  font-weight: bold;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.user-meta {
  font-size: 0.7em;
  color: var(--text-secondary);
}

.logout-btn {
  color: var(--error-color);
  border-top: 1px solid var(--surface-border);
  border-left: none;
}
.logout-btn:hover {
  background: rgba(239, 71, 111, 0.1);
  border-left-color: transparent;
}

.main-content {
  flex: 1;
  padding: 1rem 1rem 1rem 0;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  min-height: 100vh;
}
</style>
