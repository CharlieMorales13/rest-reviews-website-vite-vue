<script setup lang="ts">
import { ref } from 'vue';
import { useAuthStore } from '@/entities/user/model/authStore';
import { useRouter } from 'vue-router';

const authStore = useAuthStore();
const router = useRouter();

const name = ref('');
const email = ref('');
const password = ref('');
const loading = ref(false);

const handleRegister = async () => {
  if (!name.value || !email.value || !password.value) return;
  loading.value = true;
  try {
    await authStore.register({ name: name.value, email: email.value, password: password.value });
    router.push('/login');
  } catch (e) {
    // Error logic is handled by store
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="auth-container">
    <div class="glass-panel auth-card">
      <div class="auth-header">
        <h1>Registro</h1>
        <p>Crea tu cuenta de estudiante</p>
      </div>
      
      <form @submit.prevent="handleRegister" class="auth-form">
        <div class="form-group">
          <label>Nombre Completo</label>
          <input type="text" v-model="name" required placeholder="Juan Perez" />
        </div>

        <div class="form-group">
          <label>Email Universitario</label>
          <input type="email" v-model="email" required placeholder="correo@anahuac.mx" />
        </div>
        
        <div class="form-group">
          <label>Contraseña</label>
          <input type="password" v-model="password" required placeholder="••••••••" minlength="6" />
        </div>

        <div v-if="authStore.error" class="error-msg">
          {{ authStore.error }}
        </div>

        <button type="submit" class="btn-primary" :disabled="loading">
          <span v-if="loading">Registrando...</span>
          <span v-else>Crear Cuenta</span>
        </button>
      </form>
      
      <div class="auth-footer">
        <p>¿Ya tienes cuenta? <router-link to="/login">Inicia Sesión</router-link></p>
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
