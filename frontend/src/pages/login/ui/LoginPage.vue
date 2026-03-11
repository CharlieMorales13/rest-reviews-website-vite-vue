<script setup lang="ts">
import { ref } from 'vue';
import { useAuthStore } from '@/entities/user/model/authStore';
import { useRouter } from 'vue-router';

const authStore = useAuthStore();
const router = useRouter();

const email = ref('');
const password = ref('');
const loading = ref(false);

const handleLogin = async () => {
  if (!email.value || !password.value) return;
  loading.value = true;
  try {
    await authStore.login({ email: email.value, password: password.value });
    router.push('/dashboard');
  } catch (e) {
    // Error is handled and exposed by authStore
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="auth-container">
    <div class="glass-panel auth-card">
      <div class="auth-header">
        <h1>Bienvenido</h1>
        <p>Sistema de Inteligencia Operativa</p>
      </div>
      
      <form @submit.prevent="handleLogin" class="auth-form">
        <div class="form-group">
          <label>Email Universitario</label>
          <input type="email" v-model="email" required placeholder="correo@anahuac.mx" />
        </div>
        
        <div class="form-group">
          <label>Contraseña</label>
          <input type="password" v-model="password" required placeholder="••••••••" />
        </div>

        <div v-if="authStore.error" class="error-msg">
          {{ authStore.error }}
        </div>

        <button type="submit" class="btn-primary" :disabled="loading">
          <span v-if="loading">Cargando...</span>
          <span v-else>Iniciar Sesión</span>
        </button>
      </form>
      
      <div class="auth-footer">
        <p>¿No tienes cuenta? <router-link to="/register">Regístrate</router-link></p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.auth-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
}
.auth-card {
  width: 100%;
  max-width: 420px;
  padding: 3rem 2.5rem;
}
.auth-header {
  text-align: center;
  margin-bottom: 2.5rem;
}
.auth-header h1 {
  font-size: 2.2rem;
  color: var(--primary-color);
  margin-bottom: 0.5rem;
}
.auth-header p {
  color: var(--text-secondary);
  font-size: 0.95rem;
}
.auth-footer {
  margin-top: 1.5rem;
  text-align: center;
  font-size: 0.9rem;
}
</style>
