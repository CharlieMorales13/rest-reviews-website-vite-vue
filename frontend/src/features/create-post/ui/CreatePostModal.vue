<script setup lang="ts">
import { ref, watch } from 'vue';
import { httpClient } from '@/shared/api/httpClient';
import { PostService } from '@/entities/post/api/PostService';
import { extractErrorMessage } from '@/shared/lib/extractError';
import type { EstablishmentPost } from '@/entities/post/model/types';

const props = defineProps<{
  isOpen: boolean;
  slug: string;
  editPost?: EstablishmentPost | null;
}>();

const emit = defineEmits<{
  close: [];
  created: [post: EstablishmentPost];
  updated: [post: EstablishmentPost];
}>();

const content = ref('');
const imageUrls = ref<string[]>([]);
const pendingFiles = ref<{ file: File; previewUrl: string; uploading: boolean; remoteUrl: string | null }[]>([]);
const submitting = ref(false);
const error = ref<string | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);

// Populate when editing
watch(() => props.isOpen, (open) => {
  if (!open) {
    content.value = '';
    imageUrls.value = [];
    pendingFiles.value = [];
    error.value = null;
    return;
  }
  if (props.editPost) {
    content.value = props.editPost.content;
    imageUrls.value = [...props.editPost.imageUrls];
  }
});

const isEditing = ref(false);
watch(() => props.editPost, (p) => { isEditing.value = !!p; }, { immediate: true });

const totalImages = () => imageUrls.value.length + pendingFiles.value.length;

const onFileSelect = async (e: Event) => {
  const files = Array.from((e.target as HTMLInputElement).files ?? []);
  if (!files.length) return;

  const remaining = 4 - totalImages();
  const toAdd = files.slice(0, remaining);

  for (const file of toAdd) {
    const entry = { file, previewUrl: URL.createObjectURL(file), uploading: true, remoteUrl: null as string | null };
    pendingFiles.value.push(entry);

    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await httpClient.post<{ success: boolean; data: { url: string } }>('/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      entry.remoteUrl = res.data.data.url;
    } catch {
      error.value = 'Error al subir una imagen. Intenta de nuevo.';
      pendingFiles.value = pendingFiles.value.filter(p => p !== entry);
    } finally {
      entry.uploading = false;
    }
  }

  if (fileInput.value) fileInput.value.value = '';
};

const removeExistingImage = (idx: number) => {
  imageUrls.value.splice(idx, 1);
};

const removePendingFile = (idx: number) => {
  const entry = pendingFiles.value[idx];
  if (entry) URL.revokeObjectURL(entry.previewUrl);
  pendingFiles.value.splice(idx, 1);
};

const handleSubmit = async () => {
  if (!content.value.trim() || submitting.value) return;
  if (pendingFiles.value.some(f => f.uploading)) {
    error.value = 'Espera a que terminen de subir las imágenes.';
    return;
  }

  error.value = null;
  submitting.value = true;

  try {
    const allUrls = [
      ...imageUrls.value,
      ...pendingFiles.value.map(f => f.remoteUrl).filter(Boolean) as string[],
    ];

    if (props.editPost) {
      const updated = await PostService.updatePost(props.slug, props.editPost.id, {
        content: content.value.trim(),
        imageUrls: allUrls,
      });
      emit('updated', updated);
    } else {
      const created = await PostService.createPost(props.slug, {
        content: content.value.trim(),
        imageUrls: allUrls,
      });
      emit('created', created);
    }
  } catch (e: unknown) {
    error.value = extractErrorMessage(e, 'Error al publicar. Intenta de nuevo.');
  } finally {
    submitting.value = false;
  }
};
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-[100] flex items-center justify-center animate-fade-in px-4">
    <div class="absolute inset-0 bg-[#0e0e10]/80 backdrop-blur-xl" @click="emit('close')"></div>

    <div class="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
      <!-- Header -->
      <div class="px-8 py-6 border-b border-black/5 bg-[#FAF9F6] flex items-center justify-between flex-shrink-0">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
            <span class="material-symbols-outlined text-orange-500 text-xl" style="font-variation-settings: 'FILL' 1;">
              {{ isEditing ? 'edit_note' : 'add_comment' }}
            </span>
          </div>
          <h3 class="text-xl font-bold text-[#0e0e10] brand">
            {{ isEditing ? 'Editar publicación' : 'Nueva publicación' }}
          </h3>
        </div>
        <button @click="emit('close')" class="w-10 h-10 rounded-full flex items-center justify-center hover:bg-black/5 text-[#adaaad] transition-colors">
          <span class="material-symbols-outlined text-xl">close</span>
        </button>
      </div>

      <!-- Body -->
      <div class="p-8 flex flex-col gap-5 overflow-y-auto">
        <!-- Content -->
        <div>
          <label class="text-xs font-bold text-orange-500 uppercase tracking-widest block mb-2">Mensaje</label>
          <textarea
            v-model="content"
            rows="5"
            maxlength="2000"
            placeholder="Comparte novedades, el menú del día, promociones o anuncios..."
            class="w-full bg-[#FAF9F6] border border-black/10 rounded-xl px-5 py-4 text-[#0e0e10] placeholder-black/30 focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all resize-none"
          ></textarea>
          <p class="text-xs text-[#adaaad] text-right mt-1">{{ content.length }}/2000</p>
        </div>

        <!-- Images -->
        <div>
          <label class="text-xs font-bold text-orange-500 uppercase tracking-widest block mb-3">
            Imágenes ({{ totalImages() }}/4)
          </label>

          <div v-if="totalImages() > 0" class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
            <!-- Existing images (when editing) -->
            <div
              v-for="(url, i) in imageUrls"
              :key="`existing-${i}`"
              class="relative aspect-square rounded-xl overflow-hidden group"
            >
              <img :src="url" class="w-full h-full object-cover" />
              <button
                @click="removeExistingImage(i)"
                class="absolute top-1 right-1 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <span class="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
            <!-- Pending uploads -->
            <div
              v-for="(f, i) in pendingFiles"
              :key="`pending-${i}`"
              class="relative aspect-square rounded-xl overflow-hidden group"
            >
              <img :src="f.previewUrl" class="w-full h-full object-cover" />
              <div v-if="f.uploading" class="absolute inset-0 bg-black/50 flex items-center justify-center">
                <span class="material-symbols-outlined text-white text-2xl animate-spin">progress_activity</span>
              </div>
              <button
                v-else
                @click="removePendingFile(i)"
                class="absolute top-1 right-1 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <span class="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
          </div>

          <button
            v-if="totalImages() < 4"
            @click="fileInput?.click()"
            class="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-black/15 text-[#adaaad] hover:border-orange-400 hover:text-orange-500 transition-colors text-sm font-semibold"
          >
            <span class="material-symbols-outlined text-base">add_photo_alternate</span>
            Agregar imagen
          </button>
          <input ref="fileInput" type="file" accept="image/*" multiple class="hidden" @change="onFileSelect" />
        </div>

        <!-- Error -->
        <div v-if="error" class="flex items-center gap-2 p-3 bg-red-50 rounded-xl border border-red-100 text-red-600 text-sm">
          <span class="material-symbols-outlined text-sm">error</span>
          {{ error }}
        </div>
      </div>

      <!-- Actions -->
      <div class="px-8 py-5 border-t border-black/5 bg-[#FAF9F6] flex items-center justify-end gap-3 flex-shrink-0">
        <button @click="emit('close')" class="px-6 py-2.5 rounded-full text-sm font-semibold text-[#525155] hover:text-[#0e0e10] hover:bg-black/5 transition-colors">
          Cancelar
        </button>
        <button
          @click="handleSubmit"
          :disabled="submitting || !content.trim()"
          class="px-8 py-2.5 rounded-full text-sm font-bold bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 min-w-[160px] justify-center"
        >
          <span v-if="submitting" class="material-symbols-outlined text-sm animate-spin">progress_activity</span>
          {{ submitting ? 'Publicando...' : isEditing ? 'Guardar cambios' : 'Publicar' }}
        </button>
      </div>
    </div>
  </div>
</template>
