<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { AdminService, type CreateUserPayload, type UserRole, type AdminEstablishment } from '@/entities/user/api/AdminService';
import { extractErrorMessage } from '@/shared/lib/extractError';

const emit = defineEmits<{
  close: [];
  created: [user: { name: string; email: string; role: string }];
}>();

const form = ref<CreateUserPayload>({
  name: '',
  email: '',
  password: '',
  role: 'student',
  establishmentId: undefined,
});

const establishments = ref<AdminEstablishment[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
const createdUser = ref<{ name: string; email: string; role: string; establishmentName?: string | null } | null>(null);

const roles: { value: UserRole; label: string; icon: string }[] = [
  { value: 'student', label: 'Estudiante', icon: 'school' },
  { value: 'manager', label: 'Gerente', icon: 'store' },
  { value: 'admin', label: 'Administrador', icon: 'admin_panel_settings' },
];

onMounted(async () => {
  try {
    establishments.value = await AdminService.listEstablishments();
  } catch {
    // non-blocking
  }
});

// Reset establishment when role changes
watch(() => form.value.role, (role) => {
  if (role !== 'manager') form.value.establishmentId = undefined;
});

const isValid = computed(() => {
  const base = form.value.name.length >= 2 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.email) &&
    form.value.password.length >= 6;
  if (form.value.role === 'manager') return base && !!form.value.establishmentId;
  return base;
});

const submit = async () => {
  if (!isValid.value || loading.value) return;
  loading.value = true;
  error.value = null;
  try {
    const user = await AdminService.createUser(form.value);
    const estabName = form.value.role === 'manager' && form.value.establishmentId
      ? (establishments.value.find(e => e.id === form.value.establishmentId)?.name ?? null)
      : null;
    createdUser.value = { name: user.name, email: user.email, role: user.role, establishmentName: estabName };
    emit('created', createdUser.value);
  } catch (e: unknown) {
    error.value = extractErrorMessage(e, 'Error al crear la cuenta.');
  } finally {
    loading.value = false;
  }
};

const close = () => emit('close');
</script>

<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="close" />

      <div class="relative w-full max-w-md bg-[#1a1a1d] rounded-3xl border border-white/10 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">

        <!-- Success State -->
        <div v-if="createdUser" class="p-8 flex flex-col items-center text-center gap-6">
          <div class="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <span class="material-symbols-outlined text-emerald-400 text-3xl" style="font-variation-settings: 'FILL' 1;">check_circle</span>
          </div>
          <div>
            <h3 class="text-2xl font-black text-white brand mb-1">¡Cuenta Creada!</h3>
            <p class="text-[#adaaad] text-sm">Comparte estas credenciales con el usuario para que pueda acceder al sistema.</p>
          </div>

          <div class="w-full bg-white/5 rounded-2xl p-5 border border-white/10 text-left space-y-3">
            <p class="text-[10px] font-bold uppercase tracking-widest text-[#adaaad] mb-3">Credenciales de acceso</p>
            <div class="flex justify-between items-center">
              <span class="text-xs text-[#adaaad]">Nombre</span>
              <span class="text-sm font-bold text-white">{{ createdUser.name }}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-xs text-[#adaaad]">Correo</span>
              <span class="text-sm font-bold text-white font-mono">{{ createdUser.email }}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-xs text-[#adaaad]">Contraseña</span>
              <span class="text-sm font-bold text-orange-400 font-mono">{{ form.password }}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-xs text-[#adaaad]">Rol</span>
              <span class="text-sm font-bold text-white capitalize">{{ createdUser.role }}</span>
            </div>
            <div v-if="createdUser.establishmentName" class="flex justify-between items-center">
              <span class="text-xs text-[#adaaad]">Establecimiento</span>
              <span class="text-sm font-bold text-orange-400">{{ createdUser.establishmentName }}</span>
            </div>
          </div>

          <button @click="close" class="w-full py-3.5 rounded-2xl bg-orange-500 hover:bg-orange-400 text-white font-bold text-sm transition-colors">
            Cerrar
          </button>
        </div>

        <!-- Form State -->
        <template v-else>
          <div class="flex items-center justify-between px-8 pt-8 pb-6 border-b border-white/5">
            <div>
              <h3 class="text-xl font-black text-white brand">Nueva Cuenta</h3>
              <p class="text-[#adaaad] text-xs mt-0.5">Crea una cuenta con acceso al sistema</p>
            </div>
            <button @click="close" class="p-2 rounded-xl text-[#adaaad] hover:text-white hover:bg-white/5 transition-colors">
              <span class="material-symbols-outlined text-xl">close</span>
            </button>
          </div>

          <form @submit.prevent="submit" class="p-8 space-y-5">
            <!-- Name -->
            <div>
              <label class="block text-xs font-bold uppercase tracking-widest text-[#adaaad] mb-2">Nombre completo</label>
              <input
                v-model="form.name"
                type="text"
                placeholder="Ej. María González"
                class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-white/20 focus:outline-none focus:border-orange-500/50 transition-all"
                autocomplete="off"
              />
            </div>

            <!-- Email -->
            <div>
              <label class="block text-xs font-bold uppercase tracking-widest text-[#adaaad] mb-2">Correo electrónico</label>
              <input
                v-model="form.email"
                type="email"
                placeholder="usuario@anahuac.mx"
                class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-white/20 focus:outline-none focus:border-orange-500/50 transition-all"
                autocomplete="off"
              />
            </div>

            <!-- Password -->
            <div>
              <label class="block text-xs font-bold uppercase tracking-widest text-[#adaaad] mb-2">Contraseña inicial</label>
              <input
                v-model="form.password"
                type="text"
                placeholder="Mínimo 6 caracteres"
                class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-white/20 focus:outline-none focus:border-orange-500/50 transition-all font-mono"
                autocomplete="new-password"
              />
              <p class="text-[10px] text-[#adaaad]/60 mt-1.5">Se mostrará al crear la cuenta para que puedas compartirla.</p>
            </div>

            <!-- Role -->
            <div>
              <label class="block text-xs font-bold uppercase tracking-widest text-[#adaaad] mb-2">Rol</label>
              <div class="grid grid-cols-3 gap-2">
                <button
                  v-for="r in roles"
                  :key="r.value"
                  type="button"
                  @click="form.role = r.value"
                  :class="[
                    'py-3 px-2 rounded-xl text-xs font-bold transition-all border flex flex-col items-center gap-1',
                    form.role === r.value
                      ? 'bg-orange-500/15 border-orange-500/50 text-orange-400'
                      : 'bg-white/5 border-white/10 text-[#adaaad] hover:border-white/20 hover:text-white'
                  ]"
                >
                  <span class="material-symbols-outlined text-base" style="font-variation-settings: 'FILL' 1;">{{ r.icon }}</span>
                  {{ r.label }}
                </button>
              </div>
            </div>

            <!-- Establishment (only for manager) -->
            <Transition name="slide-error">
              <div v-if="form.role === 'manager'">
                <label class="block text-xs font-bold uppercase tracking-widest text-[#adaaad] mb-2">
                  Establecimiento asignado
                  <span class="text-red-400 ml-1">*</span>
                </label>
                <select
                  v-model="form.establishmentId"
                  class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-orange-500/50 transition-all appearance-none"
                >
                  <option value="" class="bg-[#1a1a1d] text-[#adaaad]">— Sin asignar —</option>
                  <option
                    v-for="e in establishments"
                    :key="e.id"
                    :value="e.id"
                    class="bg-[#1a1a1d] text-white"
                  >
                    {{ e.name }}{{ e.category ? ` · ${e.category}` : '' }}
                  </option>
                </select>
                <p class="text-[10px] text-[#adaaad]/60 mt-1.5">Obligatorio para gerentes. Podrá ver métricas y responder reseñas de este establecimiento.</p>
              </div>
            </Transition>

            <!-- Error -->
            <Transition name="slide-error">
              <div v-if="error" class="flex items-center gap-3 p-3.5 bg-red-500/10 rounded-xl border border-red-500/20">
                <span class="material-symbols-outlined text-red-400 text-sm">error</span>
                <p class="text-sm text-red-400">{{ error }}</p>
              </div>
            </Transition>

            <!-- Submit -->
            <button
              type="submit"
              :disabled="!isValid || loading"
              class="w-full py-3.5 rounded-2xl font-bold text-sm transition-all duration-200 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              :class="isValid && !loading
                ? 'bg-orange-500 hover:bg-orange-400 text-white shadow-lg shadow-orange-500/20'
                : 'bg-white/5 text-[#adaaad]'"
            >
              <span v-if="loading" class="material-symbols-outlined text-lg animate-spin">progress_activity</span>
              <span v-else class="material-symbols-outlined text-lg" style="font-variation-settings: 'FILL' 1;">person_add</span>
              {{ loading ? 'Creando cuenta...' : 'Crear Cuenta' }}
            </button>
          </form>
        </template>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.slide-error-enter-active, .slide-error-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease, max-height 0.25s ease;
  max-height: 200px;
  overflow: hidden;
}
.slide-error-enter-from, .slide-error-leave-to {
  opacity: 0;
  transform: translateY(-6px);
  max-height: 0;
}
</style>
