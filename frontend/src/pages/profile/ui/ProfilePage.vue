<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';
import { useAuthStore } from '@/entities/user/model/authStore';
import { ReviewService } from '@/entities/review/api/ReviewService';
import EditProfileModal from './EditProfileModal.vue';
import ChangePasswordModal from './ChangePasswordModal.vue';

const authStore = useAuthStore();
const reviewCount = ref<number | null>(null);

onMounted(async () => {
  authStore.fetchProfile();
  try {
    const myReviews = await ReviewService.getMyReviews();
    reviewCount.value = myReviews.length;
  } catch {
    reviewCount.value = 0;
  }
});

const userName = computed(() => authStore.user?.name || '');
const userBio = computed(() => authStore.user?.bio || null);
const userAvatar = computed(() => authStore.user?.avatarUrl || null);
const userCarrera = computed(() => authStore.user?.carrera || null);

const userInitials = computed(() => {
  const parts = userName.value.split(' ');
  if (parts.length >= 2 && parts[0] && parts[1]) {
    return (parts[0][0] || '') + (parts[1][0] || '');
  }
  return (parts[0] || '').substring(0, 2).toUpperCase();
});

const isEditModalOpen = ref(false);
const isChangePasswordOpen = ref(false);
</script>

<template>
  <div class="max-w-4xl mx-auto px-6 py-12 w-full animate-fade-in">
    <!-- Profile Header Section -->
    <section class="mb-12">
        <div class="flex flex-col md:flex-row items-center md:items-end gap-8">
            <div class="relative">
                <div class="w-32 h-32 rounded-3xl overflow-hidden ring-4 ring-primary/20 shadow-2xl bg-surface-variant flex items-center justify-center">
                    <img
                        v-if="userAvatar"
                        class="w-full h-full object-cover"
                        :src="userAvatar"
                        alt="Foto de perfil"
                    />
                    <span v-else class="text-4xl font-display font-black text-primary">{{ userInitials }}</span>
                </div>
                <button @click="isEditModalOpen = true" class="absolute -bottom-2 -right-2 p-2 bg-[#2c2c2f] rounded-full border border-outline-variant shadow-lg text-primary hover:text-orange-400 transition-colors">
                    <span class="material-symbols-outlined text-sm" style="font-variation-settings: 'FILL' 1;">edit</span>
                </button>
            </div>
            <div class="flex-1 text-center md:text-left">
                <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 class="text-4xl font-headline font-extrabold tracking-tight text-on-surface brand">{{ userName }}</h2>
                        <p class="text-primary font-headline font-medium tracking-wide mt-1">
                          {{ userCarrera ? userCarrera : 'Alumno' }} · UAO
                        </p>
                        <p v-if="userBio" class="text-on-surface-variant text-sm mt-2 max-w-xs leading-relaxed">{{ userBio }}</p>
                    </div>
                    <button @click="isEditModalOpen = true" class="px-6 py-2.5 rounded-xl border border-outline-variant/30 text-on-surface-variant font-medium hover:bg-surface-variant hover:text-on-surface transition-all active:scale-95">
                        Editar Perfil
                    </button>
                </div>
            </div>
        </div>
        
        <div class="grid grid-cols-2 gap-4 mt-12 py-6 border-y border-outline-variant/15">
            <div class="text-center">
                <span class="block text-2xl font-headline font-black text-on-surface brand">
                  {{ reviewCount === null ? '…' : reviewCount }}
                </span>
                <span class="text-xs text-on-surface-variant uppercase tracking-widest font-semibold">Reseñas</span>
            </div>
            <div class="text-center border-l border-outline-variant/15">
                <span class="block text-2xl font-headline font-black text-on-surface brand">Oax</span>
                <span class="text-xs text-on-surface-variant uppercase tracking-widest font-semibold">Campus</span>
            </div>
        </div>
    </section>

    <!-- Security section -->
    <section class="mb-8">
        <div class="flex items-center justify-between mb-6">
            <h3 class="text-2xl font-headline font-bold text-[#f9f5f8] brand">Seguridad</h3>
        </div>
        <button @click="isChangePasswordOpen = true" class="w-full flex items-center justify-between p-6 card-cream rounded-2xl border border-black/5 shadow-sm hover:shadow-md transition-all group">
            <div class="flex items-center gap-4">
                <div class="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                    <span class="material-symbols-outlined text-2xl">lock</span>
                </div>
                <div class="text-left">
                    <p class="font-bold text-[#0e0e10] brand">Cambiar contraseña</p>
                    <p class="text-sm text-[#adaaad]">Actualiza tu contraseña de acceso</p>
                </div>
            </div>
            <span class="material-symbols-outlined text-[#adaaad] group-hover:text-blue-500 transition-colors">chevron_right</span>
        </button>
    </section>

    <!-- Link to My Reviews page -->
    <section>
        <div class="flex items-center justify-between mb-6">
            <h3 class="text-2xl font-headline font-bold text-[#f9f5f8] brand">Mis Reseñas Históricas</h3>
        </div>
        <RouterLink to="/my-reviews" class="flex items-center justify-between p-6 card-cream rounded-2xl border border-black/5 shadow-sm hover:shadow-md transition-all group">
            <div class="flex items-center gap-4">
                <div class="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
                    <span class="material-symbols-outlined text-2xl">rate_review</span>
                </div>
                <div>
                    <p class="font-bold text-[#0e0e10] brand">Ver todas mis reseñas</p>
                    <p class="text-sm text-[#adaaad]">{{ reviewCount === null ? '…' : reviewCount }} reseña{{ reviewCount === 1 ? '' : 's' }} publicada{{ reviewCount === 1 ? '' : 's' }}</p>
                </div>
            </div>
            <span class="material-symbols-outlined text-[#adaaad] group-hover:text-orange-500 transition-colors">chevron_right</span>
        </RouterLink>
    </section>

    <ChangePasswordModal
      :isOpen="isChangePasswordOpen"
      @close="isChangePasswordOpen = false"
    />

    <!-- Edit Profile Modal Integration -->
    <EditProfileModal
      :isOpen="isEditModalOpen"
      :initialName="userName"
      :initialBio="userBio ?? undefined"
      :initialCarrera="userCarrera"
      :initialAvatarUrl="userAvatar"
      @close="isEditModalOpen = false"
      @saved="isEditModalOpen = false"
    />
  </div>
</template>
