<script setup lang="ts">
import { ref } from 'vue';
import { httpClient } from '@/shared/api/httpClient';
import { extractErrorMessage } from '@/shared/lib/extractError';

defineProps<{ isOpen: boolean }>();
const emit = defineEmits(['close']);

const currentPassword = ref('');
const newPassword = ref('');
const confirmPassword = ref('');
const saving = ref(false);
const error = ref<string | null>(null);
const success = ref(false);

function reset() {
  currentPassword.value = '';
  newPassword.value = '';
  confirmPassword.value = '';
  error.value = null;
  success.value = false;
}

function handleClose() {
  if (!saving.value) {
    reset();
    emit('close');
  }
}

async function handleSave() {
  error.value = null;
  if (newPassword.value !== confirmPassword.value) {
    error.value = 'Las contraseñas nuevas no coinciden.';
    return;
  }
  if (newPassword.value.length < 6) {
    error.value = 'La nueva contraseña debe tener al menos 6 caracteres.';
    return;
  }
  saving.value = true;
  try {
    await httpClient.patch('/api/auth/me/password', {
      currentPassword: currentPassword.value,
      newPassword: newPassword.value,
    });
    success.value = true;
    setTimeout(() => {
      handleClose();
    }, 1500);
  } catch (e: unknown) {
    error.value = extractErrorMessage(e, 'No se pudo cambiar la contraseña.');
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-[100] flex items-center justify-center animate-fade-in">
    <div class="absolute inset-0 bg-surface/60 backdrop-blur-glass" @click="handleClose"></div>

    <div class="relative w-full max-w-md mx-4 bg-surface-container-high rounded-[2rem] p-8 shadow-ambient border border-outline-variant/10 flex flex-col gap-6">

      <div class="flex items-center justify-between">
        <h3 class="text-2xl font-display font-bold text-on-surface tracking-tight">Cambiar Contraseña</h3>
        <button @click="handleClose" :disabled="saving" class="w-10 h-10 rounded-full flex items-center justify-center bg-surface-container-low hover:bg-surface-variant transition-colors group">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-on-surface-variant group-hover:text-primary"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </button>
      </div>

      <!-- Success state -->
      <div v-if="success" class="flex flex-col items-center gap-3 py-6">
        <span class="material-symbols-outlined text-5xl text-emerald-500" style="font-variation-settings: 'FILL' 1;">check_circle</span>
        <p class="text-on-surface font-semibold text-center">¡Contraseña actualizada correctamente!</p>
      </div>

      <template v-else>
        <div class="flex flex-col gap-4">
          <div class="flex flex-col gap-2">
            <label class="text-xs font-semibold text-on-surface-variant uppercase tracking-widest">Contraseña actual</label>
            <input
              v-model="currentPassword"
              type="password"
              autocomplete="current-password"
              placeholder="Tu contraseña actual"
              class="w-full bg-surface-container-lowest border border-outline-variant/15 rounded-xl px-4 py-3.5 text-black font-sans placeholder-on-surface-variant/60 focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all"
            />
          </div>

          <div class="flex flex-col gap-2">
            <label class="text-xs font-semibold text-on-surface-variant uppercase tracking-widest">Nueva contraseña</label>
            <input
              v-model="newPassword"
              type="password"
              autocomplete="new-password"
              placeholder="Mínimo 6 caracteres"
              class="w-full bg-surface-container-lowest border border-outline-variant/15 rounded-xl px-4 py-3.5 text-black font-sans placeholder-on-surface-variant/60 focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all"
            />
          </div>

          <div class="flex flex-col gap-2">
            <label class="text-xs font-semibold text-on-surface-variant uppercase tracking-widest">Confirmar nueva contraseña</label>
            <input
              v-model="confirmPassword"
              type="password"
              autocomplete="new-password"
              placeholder="Repite la nueva contraseña"
              class="w-full bg-surface-container-lowest border border-outline-variant/15 rounded-xl px-4 py-3.5 text-black font-sans placeholder-on-surface-variant/60 focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all"
            />
          </div>

          <div v-if="error" class="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm">
            {{ error }}
          </div>
        </div>

        <div class="flex items-center justify-end gap-3 pt-2 border-t border-outline-variant/5">
          <button @click="handleClose" :disabled="saving" class="px-6 py-2.5 rounded-full text-sm font-semibold text-on-surface-variant hover:text-on-surface hover:bg-surface-variant transition-colors disabled:opacity-50">
            Cancelar
          </button>
          <button
            @click="handleSave"
            :disabled="saving || !currentPassword || !newPassword || !confirmPassword"
            class="px-8 py-2.5 rounded-full text-sm font-bold bg-gradient-to-r from-primary to-primary-container text-surface shadow-btn-primary hover:shadow-[0_10px_20px_rgba(255,145,83,0.3)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <span v-if="saving" class="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
            {{ saving ? 'Guardando…' : 'Cambiar Contraseña' }}
          </button>
        </div>
      </template>

    </div>
  </div>
</template>
