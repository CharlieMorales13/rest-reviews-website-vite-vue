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
  
  if (!email.value.endsWith('@anahuac.mx')) {
    authStore.$patch({ error: 'Solo se permiten correos institucionales (@anahuac.mx)' });
    return;
  }

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
  <div class="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-black">
    <!-- Background Image with Overlay -->
    <div 
      class="absolute inset-0 bg-cover bg-center blur-[1px] scale-105 transition-transform duration-1000"
      style="background-image: url('/assets/images/university-bg.png');"
    ></div>
    <div class="absolute inset-0 bg-black/60 md:bg-black/50 lg:bg-gradient-to-r lg:from-black/80 lg:to-black/30"></div>

    <!-- Content -->
    <div class="relative z-10 w-full max-w-md p-6 animate-fade-in">
      <div class="glass-effect rounded-[32px] p-8 md:p-12 shadow-2xl">
        <div class="text-center mb-10">
          <div class="w-16 h-16 bg-anahuac-orange text-white text-3xl font-extrabold flex items-center justify-center rounded-2xl mx-auto mb-6 shadow-lg shadow-anahuac-orange/30">
            A
          </div>
          <h1 class="text-3xl font-bold tracking-tight text-white mb-2">Únete</h1>
          <p class="text-white/60 text-sm">Crea tu cuenta universitaria</p>
        </div>

        <!-- Auth Tabs -->
        <div class="flex bg-white/5 p-1 rounded-2xl mb-8">
          <router-link to="/login" class="flex-1 py-2.5 text-sm font-semibold rounded-xl text-white/50 hover:text-white transition-all text-center">
            Iniciar Sesión
          </router-link>
          <button class="flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all duration-300 bg-white/10 text-white shadow-lg">
            Registrarse
          </button>
        </div>
        
        <form @submit.prevent="handleRegister" class="space-y-4">
          <div class="space-y-2">
            <label class="block text-xs font-medium text-white/50 ml-1 uppercase tracking-wider">Nombre de Usuario</label>
            <div class="relative group">
              <span class="absolute left-4 top-1/2 -translate-y-1/2 text-lg opacity-40 group-focus-within:opacity-100 transition-opacity">👤</span>
              <input 
                type="text" 
                v-model="name" 
                required 
                placeholder="Nombre de Usuario"
                class="glass-input pl-12" 
              />
            </div>
          </div>

          <div class="space-y-2">
            <label class="block text-xs font-medium text-white/50 ml-1 uppercase tracking-wider">Email Universitario</label>
            <div class="relative group">
              <span class="absolute left-4 top-1/2 -translate-y-1/2 text-lg opacity-40 group-focus-within:opacity-100 transition-opacity">✉️</span>
              <input 
                type="email" 
                v-model="email" 
                required 
                placeholder="correo@anahuac.mx" 
                class="glass-input pl-12" 
              />
            </div>
          </div>
          
          <div class="space-y-2">
            <label class="block text-xs font-medium text-white/50 ml-1 uppercase tracking-wider">Contraseña</label>
            <div class="relative group">
              <span class="absolute left-4 top-1/2 -translate-y-1/2 text-lg opacity-40 group-focus-within:opacity-100 transition-opacity">🔒</span>
              <input 
                type="password" 
                v-model="password" 
                required 
                placeholder="Mínimo 6 caracteres" 
                class="glass-input pl-12" 
                minlength="6"
              />
            </div>
          </div>

          <div v-if="authStore.error" class="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm animate-fade-in">
            {{ authStore.error }}
          </div>

          <button type="submit" class="btn-premium w-full mt-4" :disabled="loading">
            <span v-if="loading" class="flex items-center justify-center gap-2">
              <div class="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
              Creando cuenta...
            </span>
            <span v-else>Registrarme ahora</span>
          </button>
        </form>
        
        <div class="mt-10 pt-8 border-t border-white/10 text-center">
          <p class="text-white/40 text-xs mb-4">© 2026 Universidad Anáhuac</p>
          <router-link to="/login" class="text-anahuac-orange text-sm font-medium hover:underline transition-all">
            ¿Ya tienes cuenta? Ingresa aquí
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>
