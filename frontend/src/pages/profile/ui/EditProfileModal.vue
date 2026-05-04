<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { useAuthStore } from '@/entities/user/model/authStore';
import { extractErrorMessage } from '@/shared/lib/extractError';
import { uploadImage } from '@/shared/api/uploadImage';
import { CARRERAS } from '@/shared/lib/constants';

const props = defineProps<{
  isOpen: boolean;
  initialName?: string;
  initialBio?: string;
  initialCarrera?: string | null;
  initialAvatarUrl?: string | null;
}>();

const emit = defineEmits(['close', 'saved']);

const authStore = useAuthStore();

const name = ref(props.initialName || '');
const bio = ref(props.initialBio || '');
const carrera = ref(props.initialCarrera || '');
const avatarUrl = ref(props.initialAvatarUrl || '');
const avatarUploading = ref(false);
const avatarError = ref<string | null>(null);
const avatarFileInput = ref<HTMLInputElement | null>(null);
const saving = ref(false);
const saveError = ref<string | null>(null);

const avatarPreview = computed(() => avatarUrl.value || null);

const userInitials = computed(() => {
  const parts = name.value.trim().split(' ');
  if (parts.length >= 2 && parts[0] && parts[1]) return (parts[0][0]! + parts[1][0]!).toUpperCase();
  return name.value.substring(0, 2).toUpperCase();
});

async function onAvatarSelect(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;
  (e.target as HTMLInputElement).value = '';

  avatarUploading.value = true;
  avatarError.value = null;
  try {
    avatarUrl.value = await uploadImage(file);
  } catch (err: any) {
    const msg = err?.response?.data?.message || (err as Error).message || 'No se pudo subir la imagen.';
    avatarError.value = msg;
  } finally {
    avatarUploading.value = false;
  }
}

// Sync form values when modal opens with fresh data from parent
watch(() => props.isOpen, (open) => {
  if (open) {
    name.value = props.initialName || '';
    bio.value = props.initialBio || '';
    carrera.value = props.initialCarrera || '';
    avatarUrl.value = props.initialAvatarUrl || '';
    avatarError.value = null;
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
      avatarUrl: avatarUrl.value || null,
    });
    emit('saved');
    emit('close');
  } catch (err: unknown) {
    saveError.value = extractErrorMessage(err, 'No se pudo guardar. Intenta de nuevo.');
  } finally {
    saving.value = false;
  }
};
</script>

<template>
  <Teleport to="body">
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

        <!-- Avatar upload -->
        <div class="flex flex-col gap-2">
          <label class="text-xs font-semibold text-on-surface-variant uppercase tracking-widest">Foto de Perfil</label>
          <div class="flex items-center gap-5">
            <!-- Preview -->
            <div class="w-20 h-20 rounded-2xl overflow-hidden bg-surface-variant flex items-center justify-center shrink-0 border border-outline-variant/20 shadow-inner relative">
              <img v-if="avatarPreview" :src="avatarPreview" class="w-full h-full object-cover" alt="Avatar" />
              <span v-else class="text-2xl font-black text-primary">{{ userInitials }}</span>
              <div v-if="avatarUploading" class="absolute inset-0 bg-black/50 flex items-center justify-center">
                <span class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              </div>
            </div>
            <!-- Buttons -->
            <div class="flex flex-col gap-2">
              <input ref="avatarFileInput" type="file" accept="image/*" class="hidden" @change="onAvatarSelect" />
              <button
                type="button"
                @click="avatarFileInput?.click()"
                :disabled="avatarUploading"
                class="px-4 py-2 text-sm font-semibold rounded-xl border border-outline-variant/30 text-on-surface hover:bg-surface-variant transition-colors disabled:opacity-50"
              >
                {{ avatarPreview ? 'Cambiar foto' : 'Subir foto' }}
              </button>
              <button
                v-if="avatarPreview"
                type="button"
                @click="avatarUrl = ''"
                :disabled="avatarUploading"
                class="px-4 py-2 text-sm font-semibold rounded-xl text-red-500 hover:bg-red-500/10 transition-colors disabled:opacity-50"
              >
                Eliminar foto
              </button>
            </div>
          </div>
          <p v-if="avatarError" class="text-xs text-red-500 font-semibold">{{ avatarError }}</p>
        </div>

        <div class="flex flex-col gap-2">
          <label class="text-xs font-semibold text-on-surface-variant uppercase tracking-widest">Nombre</label>
          <input
            v-model="name"
            type="text"
            maxlength="120"
            class="w-full bg-surface-container-lowest border border-outline-variant/15 rounded-xl px-4 py-3.5 text-on-surface font-sans placeholder-on-surface-variant/100 focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all shadow-inner"
            placeholder="Tu nombre completo"
          />
        </div>

        <div class="flex flex-col gap-2">
          <label class="text-xs font-semibold text-on-surface-variant uppercase tracking-widest">Biografía</label>
          <textarea
            v-model="bio"
            rows="3"
            maxlength="500"
            class="w-full bg-surface-container-lowest border border-outline-variant/15 rounded-xl px-4 py-3.5 text-on-surface font-sans placeholder-on-surface-variant/100 focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all resize-none shadow-inner"
            placeholder="Cuéntanos sobre ti…"
          ></textarea>
          <span class="text-right text-xs text-on-surface-variant/50">{{ bio.length }} / 500</span>
        </div>

        <div class="flex flex-col gap-2">
          <label class="text-xs font-semibold text-on-surface-variant uppercase tracking-widest">Carrera</label>
          <div class="relative">
            <select
              v-model="carrera"
              class="w-full bg-surface-container-lowest border border-outline-variant/15 rounded-xl px-4 py-3.5 text-on-surface font-sans focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all appearance-none"
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
  </Teleport>
</template>
