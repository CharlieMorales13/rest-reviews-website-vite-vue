<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps<{
  isOpen: boolean;
  initialName?: string;
  initialBio?: string;
}>();

const emit = defineEmits(['close', 'save']);

const mockName = ref(props.initialName || 'Carlos López');
const mockBio = ref(props.initialBio || 'Soy estudiante de la Anáhuac. Me encanta probar nuevos restaurantes cerca del campus después de clases.');
const isUploading = ref(false);

const handleClose = () => {
  emit('close');
};

const handleSave = () => {
  // Simulating API call
  emit('save', { name: mockName.value, bio: mockBio.value });
  emit('close');
};

const handlePhotoUpload = () => {
  isUploading.value = true;
  setTimeout(() => isUploading.value = false, 1500); // fake upload
};
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-[100] flex items-center justify-center animate-fade-in">
    <!-- Backstop Blur Glass Layer -->
    <div class="absolute inset-0 bg-surface/60 backdrop-blur-glass" @click="handleClose"></div>

    <!-- Modal Content -->
    <div class="relative w-full max-w-lg mx-4 bg-surface-container-high rounded-[2rem] p-8 shadow-ambient border border-outline-variant/10 transform transition-all duration-300 scale-100 opacity-100 flex flex-col gap-8">
      
      <!-- Header -->
      <div class="flex items-center justify-between">
        <h3 class="text-2xl font-display font-bold text-on-surface tracking-tight">Edit Profile</h3>
        <button @click="handleClose" class="w-10 h-10 rounded-full flex items-center justify-center bg-surface-container-low hover:bg-surface-variant transition-colors group">
           <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-on-surface-variant group-hover:text-primary"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </button>
      </div>

      <!-- Ghost Border Input Form -->
      <div class="flex flex-col gap-6">
        
        <!-- Avatar Dropzone -->
        <div class="flex flex-col items-center gap-4">
          <div class="relative w-28 h-28 rounded-full bg-surface-container-lowest border border-outline-variant/15 flex items-center justify-center overflow-hidden cursor-pointer group hover:border-primary/50 transition-colors" @click="handlePhotoUpload">
            <div class="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 backdrop-blur-sm">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-white"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
            </div>
            <!-- Mock Avatar inside -->
            <img v-if="!isUploading" src="https://ui-avatars.com/api/?name=C+L&background=random" class="w-full h-full object-cover" />
            <span v-else class="text-primary font-bold animate-pulse text-sm">Uploading...</span>
          </div>
          <span class="text-xs font-semibold text-on-surface-variant uppercase tracking-widest">Update Photo</span>
        </div>

        <!-- Name Input -->
        <div class="flex flex-col gap-2">
          <label class="text-xs font-semibold text-on-surface-variant uppercase tracking-widest">Display Name</label>
          <input 
            v-model="mockName"
            type="text" 
            class="w-full bg-surface-container-lowest border border-outline-variant/15 rounded-xl px-4 py-3.5 text-on-surface font-sans placeholder-on-surface-variant/50 focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all shadow-inner"
            placeholder="Your name"
          />
        </div>

        <!-- Bio Input -->
        <div class="flex flex-col gap-2">
          <label class="text-xs font-semibold text-on-surface-variant uppercase tracking-widest">Bio</label>
          <textarea 
            v-model="mockBio"
            rows="3"
            class="w-full bg-surface-container-lowest border border-outline-variant/15 rounded-xl px-4 py-3.5 text-on-surface font-sans placeholder-on-surface-variant/50 focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all resize-none shadow-inner"
            placeholder="Tell us about your culinary journey..."
          ></textarea>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex items-center justify-end gap-3 pt-4 border-t border-outline-variant/5">
        <button @click="handleClose" class="px-6 py-2.5 rounded-full text-sm font-semibold text-on-surface-variant hover:text-on-surface hover:bg-surface-variant transition-colors">
          Cancel
        </button>
        <button @click="handleSave" class="px-8 py-2.5 rounded-full text-sm font-bold bg-gradient-to-r from-primary to-primary-container text-surface shadow-btn-primary hover:shadow-[0_10px_20px_rgba(255,145,83,0.3)] transition-all">
          Save Changes
        </button>
      </div>
      
    </div>
  </div>
</template>
