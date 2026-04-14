<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { AdminService, type AdminUser, type UserRole, type AdminEstablishment } from '@/entities/user/api/AdminService';
import { extractErrorMessage } from '@/shared/lib/extractError';

const props = defineProps<{ user: AdminUser }>();
const emit = defineEmits<{
  close: [];
  updated: [user: AdminUser];
}>();

const form = ref({
  name: props.user.name,
  email: props.user.email,
  role: props.user.role as UserRole,
  isActive: props.user.isActive,
  establishmentId: props.user.establishment?.id ?? '',
});

const establishments = ref<AdminEstablishment[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);

const roles: { value: UserRole; label: string; icon: string }[] = [
  { value: 'student', label: 'Estudiante', icon: 'school' },
  { value: 'manager', label: 'Gerente', icon: 'store' },
  { value: 'admin', label: 'Administrador', icon: 'admin_panel_settings' },
];

onMounted(async () => {
  try {
    establishments.value = await AdminService.listEstablishments();
  } catch { /* non-blocking */ }
});

watch(() => form.value.role, (role) => {
  if (role !== 'manager') form.value.establishmentId = '';
});

const isDirty = computed(() =>
  form.value.name !== props.user.name ||
  form.value.email !== props.user.email ||
  form.value.role !== props.user.role ||
  form.value.isActive !== props.user.isActive ||
  form.value.establishmentId !== (props.user.establishment?.id ?? '')
);

const submit = async () => {
  if (!isDirty.value || loading.value) return;
  loading.value = true;
  error.value = null;
  try {
    const payload: Record<string, unknown> = {
      name: form.value.name,
      email: form.value.email,
      role: form.value.role,
      isActive: form.value.isActive,
    };
    if (form.value.role === 'manager') {
      payload.establishmentId = form.value.establishmentId || null;
    }
    const updated = await AdminService.updateUser(props.user.id, payload);
    emit('updated', updated);
  } catch (e: unknown) {
    error.value = extractErrorMessage(e, 'Error al actualizar la cuenta.');
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="$emit('close')" />

      <div class="relative w-full max-w-md bg-[#1a1a1d] rounded-3xl border border-white/10 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        <!-- Header -->
        <div class="flex items-center justify-between px-8 pt-8 pb-6 border-b border-white/5">
          <div>
            <h3 class="text-xl font-black text-white brand">Editar Cuenta</h3>
            <p class="text-[#adaaad] text-xs mt-0.5 font-mono truncate max-w-[220px]">{{ user.email }}</p>
          </div>
          <button @click="$emit('close')" class="p-2 rounded-xl text-[#adaaad] hover:text-white hover:bg-white/5 transition-colors">
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
              class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-orange-500/50 transition-all"
            />
          </div>

          <!-- Email -->
          <div>
            <label class="block text-xs font-bold uppercase tracking-widest text-[#adaaad] mb-2">Correo electrónico</label>
            <input
              v-model="form.email"
              type="email"
              class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-orange-500/50 transition-all"
            />
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

          <!-- Establishment (manager only) -->
          <Transition name="slide-field">
            <div v-if="form.role === 'manager'">
              <label class="block text-xs font-bold uppercase tracking-widest text-[#adaaad] mb-2">Establecimiento asignado</label>
              <select
                v-model="form.establishmentId"
                class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-orange-500/50 transition-all appearance-none"
              >
                <option value="" class="bg-[#1a1a1d] text-[#adaaad]">— Sin asignar —</option>
                <option v-for="e in establishments" :key="e.id" :value="e.id" class="bg-[#1a1a1d] text-white">
                  {{ e.name }}{{ e.category ? ` · ${e.category}` : '' }}
                </option>
              </select>
            </div>
          </Transition>

          <!-- Active status -->
          <div class="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
            <div>
              <p class="text-sm font-bold text-white">Estado de la cuenta</p>
              <p class="text-xs text-[#adaaad] mt-0.5">{{ form.isActive ? 'Cuenta activa' : 'Cuenta suspendida' }}</p>
            </div>
            <button
              type="button"
              @click="form.isActive = !form.isActive"
              :class="[
                'w-12 h-6 rounded-full transition-colors relative flex-shrink-0',
                form.isActive ? 'bg-emerald-500' : 'bg-white/20'
              ]"
            >
              <span
                :class="[
                  'absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform',
                  form.isActive ? 'translate-x-6' : 'translate-x-0.5'
                ]"
              />
            </button>
          </div>

          <!-- Error -->
          <Transition name="slide-field">
            <div v-if="error" class="flex items-center gap-3 p-3.5 bg-red-500/10 rounded-xl border border-red-500/20">
              <span class="material-symbols-outlined text-red-400 text-sm">error</span>
              <p class="text-sm text-red-400">{{ error }}</p>
            </div>
          </Transition>

          <div class="flex gap-3">
            <button
              type="button"
              @click="$emit('close')"
              class="flex-1 py-3.5 rounded-2xl bg-white/5 hover:bg-white/10 text-[#adaaad] font-bold text-sm transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              :disabled="!isDirty || loading"
              class="flex-1 py-3.5 rounded-2xl font-bold text-sm transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-400 text-white"
            >
              <span v-if="loading" class="material-symbols-outlined text-lg animate-spin">progress_activity</span>
              <span v-else class="material-symbols-outlined text-lg" style="font-variation-settings: 'FILL' 1;">save</span>
              {{ loading ? 'Guardando...' : 'Guardar Cambios' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.slide-field-enter-active, .slide-field-leave-active {
  transition: opacity 0.2s ease, max-height 0.25s ease;
  max-height: 150px;
  overflow: hidden;
}
.slide-field-enter-from, .slide-field-leave-to {
  opacity: 0;
  max-height: 0;
}
</style>
