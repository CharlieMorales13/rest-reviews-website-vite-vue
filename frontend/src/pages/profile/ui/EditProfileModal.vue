<script setup lang="ts">
import { ref, watch } from 'vue';
import { useAuthStore } from '@/entities/user/model/authStore';

const CARRERAS = [
  'Administración de Empresas',
  'Colaboradores',
  'Comunicación',
  'Derecho',
  'Diseño de Moda e Innovación',
  'Diseño Gráfico',
  'Diseño Industrial',
  'Diseño Multimedia',
  'Egresados',
  'Finanzas y Contaduría Pública',
  'Turismo',
  'Gastronomía',
  'Ingeniería Biomédica',
  'Ingeniería Civil',
  'Ingeniería Industrial para la Dirección',
  'Ingeniería Mecatrónica',
  'Ingeniería en Tecnologías de la Información y Negocios Digitales',
  'Médico Cirujano',
  'Mercadotecnia Estratégica',
  'Psicología',
];

const props = defineProps<{
  isOpen: boolean;
  initialName?: string;
  initialBio?: string;
  initialCarrera?: string | null;
}>();

const emit = defineEmits(['close', 'saved']);

const authStore = useAuthStore();

const name = ref(props.initialName || '');
const bio = ref(props.initialBio || '');
const carrera = ref(props.initialCarrera || '');
const saving = ref(false);
const saveError = ref<string | null>(null);

// Sync form values when modal opens with fresh data from parent
watch(() => props.isOpen, (open) => {
  if (open) {
    name.value = props.initialName || '';
    bio.value = props.initialBio || '';
    carrera.value = props.initialCarrera || '';
    saveError.value = null;
  }
});

const handleClose = () => {
  if (!saving.value) emit('close');
};

const handleSave = async () => {
  if (!name.value.trim() || saving.value) return;
  saving.value = true;
  saveError.value = null;
  try {
    await authStore.updateProfile({
      name: name.value.trim(),
      bio: bio.value.trim() || null,
      carrera: carrera.value || null,
    });
    emit('saved');
    emit('close');
  } catch (err: any) {
    saveError.value = err.response?.data?.message || 'No se pudo guardar. Intenta de nuevo.';
  } finally {
    saving.value = false;
  }
};
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-[100] flex items-center justify-center animate-fade-in">
    <div class="absolute inset-0 bg-surface/60 backdrop-blur-glass" @click="handleClose"></div>

    <div class="relative w-full max-w-lg mx-4 bg-surface-container-high rounded-[2rem] p-8 shadow-ambient border border-outline-variant/10 flex flex-col gap-8">

      <div class="flex items-center justify-between">
        <h3 class="text-2xl font-display font-bold text-on-surface tracking-tight">Editar Perfil</h3>
        <button @click="handleClose" :disabled="saving" class="w-10 h-10 rounded-full flex items-center justify-center bg-surface-container-low hover:bg-surface-variant transition-colors group">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-on-surface-variant group-hover:text-primary"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </button>
      </div>

      <div class="flex flex-col gap-6">
        <div class="flex flex-col gap-2">
          <label class="text-xs font-semibold text-on-surface-variant uppercase tracking-widest">Nombre</label>
          <input
            v-model="name"
            type="text"
            maxlength="120"
            class="w-full bg-surface-container-lowest border border-outline-variant/15 rounded-xl px-4 py-3.5 text-black font-sans placeholder-on-surface-variant/100 focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all shadow-inner"
            placeholder="Tu nombre completo"
          />
        </div>

        <div class="flex flex-col gap-2">
          <label class="text-xs font-semibold text-on-surface-variant uppercase tracking-widest">Biografía</label>
          <textarea
            v-model="bio"
            rows="3"
            maxlength="500"
            class="w-full bg-surface-container-lowest border border-outline-variant/15 rounded-xl px-4 py-3.5 text-black  font-sans placeholder-on-surface-variant/100 focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all resize-none shadow-inner"
            placeholder="Cuéntanos sobre ti…"
          ></textarea>
          <span class="text-right text-xs text-on-surface-variant/50">{{ bio.length }} / 500</span>
        </div>

        <div class="flex flex-col gap-2">
          <label class="text-xs font-semibold text-on-surface-variant uppercase tracking-widest">Carrera</label>
          <div class="relative">
            <select
              v-model="carrera"
              class="w-full bg-surface-container-lowest border border-outline-variant/15 rounded-xl px-4 py-3.5 text-black font-sans focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all appearance-none"
            >
              <option value="">Sin especificar</option>
              <option v-for="c in CARRERAS" :key="c" :value="c">{{ c }}</option>
            </select>
            <span class="absolute right-4 top-1/2 -translate-y-1/2 text-black/40 pointer-events-none">▾</span>
          </div>
        </div>

        <div v-if="saveError" class="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm">
          {{ saveError }}
        </div>
      </div>

      <div class="flex items-center justify-end gap-3 pt-4 border-t border-outline-variant/5">
        <button @click="handleClose" :disabled="saving" class="px-6 py-2.5 rounded-full text-sm font-semibold text-on-surface-variant hover:text-on-surface hover:bg-surface-variant transition-colors disabled:opacity-50">
          Cancelar
        </button>
        <button @click="handleSave" :disabled="saving || !name.trim()" class="px-8 py-2.5 rounded-full text-sm font-bold bg-gradient-to-r from-primary to-primary-container text-surface shadow-btn-primary hover:shadow-[0_10px_20px_rgba(255,145,83,0.3)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
          <span v-if="saving" class="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
          {{ saving ? 'Guardando…' : 'Guardar Cambios' }}
        </button>
      </div>
    </div>
  </div>
</template>
