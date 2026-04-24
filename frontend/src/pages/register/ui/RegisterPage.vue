<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useAuthStore } from '@/entities/user/model/authStore';
import { useRouter } from 'vue-router';
import { CARRERAS } from '@/shared/lib/constants';

const authStore = useAuthStore();
const router = useRouter();

const NON_STUDENT_TYPES = [
  { value: 'Colaborador UAO',  label: 'Colaborador', icon: 'badge' },
  { value: 'Egresado UAO',     label: 'Egresado',    icon: 'school' },
  { value: 'Padre de Familia', label: 'Padre de Familia', icon: 'family_restroom' },
  { value: 'Otro',             label: 'Otro',         icon: 'person' },
];

// ── Form fields ──────────────────────────────────────────────────────────────
const name         = ref('');
const email        = ref('');
const password     = ref('');
const loading      = ref(false);
const showPassword = ref(false);

// ── Carrera / tipo de usuario ────────────────────────────────────────────────
const isStudent       = ref(true);
const carrera         = ref('');
const carreraOpen     = ref(false);
const nonStudentType  = ref('');
const nonStudentOther = ref('');

const carreraDropdownRef = ref<HTMLElement | null>(null);

function closeDropdown(e: MouseEvent) {
  if (carreraDropdownRef.value && !carreraDropdownRef.value.contains(e.target as Node)) {
    carreraOpen.value = false;
  }
}
onMounted(() => document.addEventListener('mousedown', closeDropdown));
onBeforeUnmount(() => document.removeEventListener('mousedown', closeDropdown));

// The value that will be sent to the backend
const resolvedCarrera = computed(() => {
  if (isStudent.value) return carrera.value;
  if (nonStudentType.value === 'Otro') return nonStudentOther.value.trim();
  return nonStudentType.value;
});

const canSubmit = computed(() => {
  if (!name.value || !email.value || !password.value) return false;
  if (isStudent.value) return !!carrera.value;
  if (!nonStudentType.value) return false;
  if (nonStudentType.value === 'Otro') return nonStudentOther.value.trim().length >= 2;
  return true;
});

const handleRegister = async () => {
  if (!canSubmit.value || loading.value) return;
  loading.value = true;
  try {
    await authStore.register({
      name: name.value,
      email: email.value,
      password: password.value,
      carrera: resolvedCarrera.value,
    });
    await router.push('/dashboard');
  } catch {
    // Error handled by store
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-black">
    <!-- Background -->
    <div
      class="absolute inset-0 bg-cover bg-center blur-[1px] scale-105"
      style="background-image: url('/assets/images/university-bg.png');"
    ></div>
    <div class="absolute inset-0 bg-black/60 md:bg-black/50 lg:bg-gradient-to-r lg:from-black/80 lg:to-black/30"></div>

    <!-- Content -->
    <div class="relative z-10 w-full max-w-md p-6 animate-fade-in">
      <div class="bg-white/5 backdrop-blur-2xl border border-white/20 rounded-[32px] p-8 md:p-12 shadow-2xl">

        <div class="text-center mb-10">
          <div class="inline-flex items-center gap-2 px-4 py-2 bg-anahuac-orange/20 border border-anahuac-orange/30 rounded-full mb-6">
            <span class="text-anahuac-orange font-extrabold text-lg tracking-tight brand">Anáhuac EATS</span>
          </div>
          <h1 class="text-3xl font-bold tracking-tight text-white mb-2">Únete</h1>
          <p class="text-white/60 text-sm">Crea tu cuenta y empieza a opinar</p>
        </div>

        <!-- Tabs -->
        <div class="flex bg-white/5 p-1 rounded-2xl mb-8">
          <router-link to="/login" class="flex-1 py-2.5 text-sm font-semibold rounded-xl text-white/50 hover:text-white transition-all text-center">
            Iniciar Sesión
          </router-link>
          <button class="flex-1 py-2.5 text-sm font-semibold rounded-xl bg-white/10 text-white shadow-lg">
            Registrarse
          </button>
        </div>

        <form @submit.prevent="handleRegister" class="space-y-4">

          <!-- Nombre -->
          <div class="space-y-2">
            <label class="block text-xs font-medium text-white/50 ml-1 uppercase tracking-wider">Nombre completo</label>
            <div class="relative group">
              <span class="absolute left-4 top-1/2 -translate-y-1/2 text-lg opacity-40 group-focus-within:opacity-100 transition-opacity">👤</span>
              <input type="text" v-model="name" required placeholder="Tu nombre completo" class="glass-input pl-12" />
            </div>
          </div>

          <!-- Email -->
          <div class="space-y-2">
            <label class="block text-xs font-medium text-white/50 ml-1 uppercase tracking-wider">Email Institucional</label>
            <div class="relative group">
              <span class="absolute left-4 top-1/2 -translate-y-1/2 text-lg opacity-40 group-focus-within:opacity-100 transition-opacity">✉️</span>
              <input type="email" v-model="email" required placeholder="correo@anahuac.mx" class="glass-input pl-12" />
            </div>
          </div>

          <!-- Contraseña -->
          <div class="space-y-2">
            <label class="block text-xs font-medium text-white/50 ml-1 uppercase tracking-wider">Contraseña</label>
            <div class="relative group">
              <span class="absolute left-4 top-1/2 -translate-y-1/2 text-lg opacity-40 group-focus-within:opacity-100 transition-opacity">🔒</span>
              <input
                :type="showPassword ? 'text' : 'password'"
                v-model="password"
                required
                placeholder="Mínimo 6 caracteres"
                class="glass-input pl-12 pr-12"
                minlength="6"
              />
              <button
                type="button"
                @click="showPassword = !showPassword"
                class="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors focus:outline-none"
                :aria-label="showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'"
              >
                <svg v-if="showPassword" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              </button>
            </div>
          </div>

          <!-- Universidad (solo lectura) -->
          <div class="space-y-2">
            <label class="block text-xs font-medium text-white/50 ml-1 uppercase tracking-wider">Universidad</label>
            <div class="relative">
              <span class="absolute left-4 top-1/2 -translate-y-1/2 text-lg opacity-40">🏛️</span>
              <input type="text" value="UAO — Universidad Anáhuac Oaxaca" disabled class="glass-input pl-12 opacity-50 cursor-not-allowed" />
            </div>
          </div>

          <!-- Toggle: ¿No eres alumno? -->
          <button
            type="button"
            @click="isStudent = !isStudent; carrera = ''; nonStudentType = ''; nonStudentOther = ''"
            class="w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-200"
            :class="!isStudent
              ? 'bg-orange-500/15 border-orange-500/40 text-orange-300'
              : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/8 hover:border-white/20'"
          >
            <div class="w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors"
              :class="!isStudent ? 'bg-orange-500 border-orange-500' : 'border-white/30'">
              <span v-if="!isStudent" class="material-symbols-outlined text-white" style="font-size:14px;font-variation-settings:'FILL' 1;">check</span>
            </div>
            <span class="text-sm font-medium">No soy alumno activo de la UAO</span>
          </button>

          <!-- ALUMNO: dropdown carrera custom -->
          <div v-if="isStudent" class="space-y-2">
            <label class="block text-xs font-medium text-white/50 ml-1 uppercase tracking-wider">
              Carrera <span class="text-anahuac-orange">*</span>
            </label>
            <div ref="carreraDropdownRef" class="relative">
              <button
                type="button"
                @click="carreraOpen = !carreraOpen"
                class="glass-input w-full flex items-center justify-between pl-12 pr-4 text-left"
                :class="carrera ? 'text-white' : 'text-white/40'"
              >
                <span class="absolute left-4 top-1/2 -translate-y-1/2 text-lg opacity-40">🎓</span>
                <span class="truncate">{{ carrera || 'Selecciona tu carrera' }}</span>
                <span class="material-symbols-outlined text-white/40 ml-2 transition-transform duration-200 flex-shrink-0"
                  :class="carreraOpen ? 'rotate-180' : ''">expand_more</span>
              </button>

              <Transition
                enter-active-class="transition-all duration-200 ease-out"
                enter-from-class="opacity-0 -translate-y-2 scale-95"
                enter-to-class="opacity-100 translate-y-0 scale-100"
                leave-active-class="transition-all duration-150 ease-in"
                leave-from-class="opacity-100 translate-y-0 scale-100"
                leave-to-class="opacity-0 -translate-y-2 scale-95"
              >
                <div
                  v-if="carreraOpen"
                  class="absolute z-50 w-full mt-2 bg-[#0f1117]/95 backdrop-blur-2xl border border-white/15 rounded-2xl overflow-hidden shadow-2xl"
                >
                  <div class="max-h-56 overflow-y-auto overscroll-contain scrollbar-thin">
                    <button
                      v-for="c in CARRERAS"
                      :key="c"
                      type="button"
                      @click="carrera = c; carreraOpen = false"
                      class="w-full text-left px-4 py-3 text-sm transition-colors flex items-center gap-3"
                      :class="carrera === c
                        ? 'text-orange-400 font-bold bg-orange-500/10'
                        : 'text-white/75 hover:bg-white/8 hover:text-white'"
                    >
                      <span v-if="carrera === c" class="material-symbols-outlined text-orange-400 flex-shrink-0" style="font-size:16px;font-variation-settings:'FILL' 1;">check_circle</span>
                      <span v-else class="w-4 flex-shrink-0"></span>
                      {{ c }}
                    </button>
                  </div>
                </div>
              </Transition>
            </div>
          </div>

          <!-- NO ALUMNO: tipo de usuario -->
          <div v-else class="space-y-3">
            <label class="block text-xs font-medium text-white/50 ml-1 uppercase tracking-wider">
              ¿Cómo describes tu relación con la UAO? <span class="text-anahuac-orange">*</span>
            </label>
            <div class="grid grid-cols-2 gap-2">
              <button
                v-for="opt in NON_STUDENT_TYPES"
                :key="opt.value"
                type="button"
                @click="nonStudentType = opt.value; nonStudentOther = ''"
                class="flex items-center gap-2 px-3 py-3 rounded-xl border text-sm font-medium transition-all duration-150 text-left"
                :class="nonStudentType === opt.value
                  ? 'bg-orange-500/20 border-orange-500/50 text-orange-300'
                  : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white'"
              >
                <span class="material-symbols-outlined text-base" style="font-variation-settings:'FILL' 1;">{{ opt.icon }}</span>
                {{ opt.label }}
              </button>
            </div>

            <!-- Campo libre para "Otro" -->
            <div v-if="nonStudentType === 'Otro'" class="space-y-1">
              <label class="block text-xs font-medium text-white/50 ml-1 uppercase tracking-wider">Especifica</label>
              <input
                v-model="nonStudentOther"
                type="text"
                maxlength="80"
                placeholder="Ej. Proveedor, Visitante, Docente..."
                class="glass-input w-full"
                autofocus
              />
            </div>
          </div>

          <!-- Error -->
          <div v-if="authStore.error" class="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm animate-fade-in">
            {{ authStore.error }}
          </div>

          <button type="submit" class="btn-premium w-full mt-4" :disabled="loading || !canSubmit">
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
