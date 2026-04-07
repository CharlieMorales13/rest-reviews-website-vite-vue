<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';
import { useAuthStore } from '@/entities/user/model/authStore';
import EditProfileModal from './EditProfileModal.vue';

const authStore = useAuthStore();

onMounted(() => {
  authStore.fetchProfile();
});

const userName = computed(() => authStore.user?.name || '');
const userBio = computed(() => authStore.user?.bio || null);
const userAvatar = computed(() => authStore.user?.avatarUrl || null);

const userInitials = computed(() => {
  const parts = userName.value.split(' ');
  if (parts.length >= 2 && parts[0] && parts[1]) {
    return (parts[0][0] || '') + (parts[1][0] || '');
  }
  return (parts[0] || '').substring(0, 2).toUpperCase();
});

const isEditModalOpen = ref(false);
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
                        <p class="text-primary font-headline font-medium tracking-wide mt-1">León Anáhuac</p>
                        <p v-if="userBio" class="text-on-surface-variant text-sm mt-2 max-w-xs leading-relaxed">{{ userBio }}</p>
                    </div>
                    <button @click="isEditModalOpen = true" class="px-6 py-2.5 rounded-xl border border-outline-variant/30 text-on-surface-variant font-medium hover:bg-surface-variant hover:text-on-surface transition-all active:scale-95">
                        Editar Perfil
                    </button>
                </div>
            </div>
        </div>
        
        <div class="grid grid-cols-3 gap-4 mt-12 py-6 border-y border-outline-variant/15">
            <div class="text-center">
                <span class="block text-2xl font-headline font-black text-on-surface brand">12</span>
                <span class="text-xs text-on-surface-variant uppercase tracking-widest font-semibold">Reseñas</span>
            </div>
            <div class="text-center border-x border-outline-variant/15">
                <span class="block text-2xl font-headline font-black text-on-surface brand">48</span>
                <span class="text-xs text-on-surface-variant uppercase tracking-widest font-semibold">Me Gusta</span>
            </div>
            <div class="text-center">
                <span class="block text-2xl font-headline font-black text-on-surface brand">Oax</span>
                <span class="text-xs text-on-surface-variant uppercase tracking-widest font-semibold">Campus</span>
            </div>
        </div>
    </section>

    <!-- Review Feed Section -->
    <section>
        <div class="flex items-center justify-between mb-8">
            <h3 class="text-2xl font-headline font-bold text-[#f9f5f8] brand">Mis Reseñas Históricas</h3>
            <div class="flex gap-2">
                <button class="p-2 rounded-lg bg-surface-container-high text-on-surface-variant hover:text-primary transition-colors">
                    <span class="material-symbols-outlined">filter_list</span>
                </button>
            </div>
        </div>
        
        <div class="space-y-8">
            <!-- Review Card 1 (Stitch format: glass-card which is cream colored) -->
            <article class="glass-card card-cream rounded-[2rem] overflow-hidden shadow-xl text-[#3f3f42]">
                <div class="p-8">
                    <div class="flex justify-between items-start mb-6">
                        <div class="flex items-center gap-4">
                            <div class="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-orange-500 shadow-sm">
                                <span class="material-symbols-outlined text-3xl">restaurant</span>
                            </div>
                            <div>
                                <h4 class="text-xl font-headline font-bold text-[#0e0e10] leading-none brand">DelyFull</h4>
                                <p class="text-sm text-[#adaaad] mt-1">Hace 2 días • Almuerzo</p>
                            </div>
                        </div>
                        <div class="flex gap-0.5 text-orange-500">
                            <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">star</span>
                            <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">star</span>
                            <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">star</span>
                            <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">star</span>
                            <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 0;">star</span>
                        </div>
                    </div>
                    <p class="text-[#3f3f42] font-medium leading-relaxed mb-6 font-sans">
                        Increíble atención. Las chilaquiles verdes estaban en su punto exacto de picor. Sin duda, la mejor opción para desayunar entre clases pesadas. Muy recomendado el café de olla.
                    </p>
                    <div class="rounded-2xl overflow-hidden mb-6 aspect-video max-h-64 shadow-inner">
                        <img class="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuB15qJAvrDO0nq-wtejKhELOK2mbESHF-5A7nZZas7UQgotcUvcxae8APXSdaPg9Gh2fulVVo_95bcEYSksGDFYg7IUBPvRh26oKlqxTPA_Li1l9ry6kd2LtAfy_8TRCo_dvIWGsn9SdcivS7LRv0UmFMLAv68cl14sQCzSkxvXizzZFT5hAVeo2Jx6goiuakwccv650BZM9gzBrFlRo2nuNkJQSnTWItSZtLrNAbUSTFFl7kjBvQ_D4yfwZi5HGPieXibVHLpec3z7"/>
                    </div>
                    
                    <!-- Manager Response -->
                    <div class="mt-8 relative pl-6">
                        <div class="absolute left-0 top-0 bottom-0 w-1 bg-orange-500/30 rounded-full"></div>
                        <div class="bg-orange-500/5 rounded-2xl p-6 border border-orange-500/10">
                            <div class="flex items-center gap-2 mb-3">
                                <span class="material-symbols-outlined text-orange-500 text-sm">reply</span>
                                <span class="text-xs font-headline font-black uppercase tracking-wider text-orange-500">Respuesta del Gerente</span>
                            </div>
                            <p class="text-[#3f3f42] text-sm italic leading-relaxed font-sans">
                                "Hola Mateo, ¡qué gusto saber que disfrutaste tus chilaquiles! Trabajamos duro para que el sabor de casa llegue a tu mesa universitaria. Te esperamos pronto por aquí."
                            </p>
                            <p class="text-[10px] text-[#adaaad] mt-3 font-semibold uppercase tracking-widest font-sans">Gerencia DelyFull • Hace 1 día</p>
                        </div>
                    </div>
                </div>
            </article>

            <!-- Review Card 2 -->
            <article class="glass-card card-cream rounded-[2rem] overflow-hidden shadow-xl text-[#3f3f42]">
                <div class="p-8">
                    <div class="flex justify-between items-start mb-6">
                        <div class="flex items-center gap-4">
                            <div class="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-orange-500 shadow-sm">
                                <span class="material-symbols-outlined text-3xl">coffee</span>
                            </div>
                            <div>
                                <h4 class="text-xl font-headline font-bold text-[#0e0e10] leading-none brand">The Coffee Hub</h4>
                                <p class="text-sm text-[#adaaad] mt-1">Hace 1 semana • Break</p>
                            </div>
                        </div>
                        <div class="flex gap-0.5 text-orange-500">
                            <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">star</span>
                            <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">star</span>
                            <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">star</span>
                            <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">star</span>
                            <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">star</span>
                        </div>
                    </div>
                    <p class="text-[#3f3f42] font-medium leading-relaxed font-sans">
                        El mejor lugar para estudiar. El latte de avellana es consistente y el personal siempre es muy amable. El Wi-Fi nunca falla, lo cual es vital para nosotros.
                    </p>
                    <div class="mt-8 flex gap-4">
                        <button class="flex items-center gap-2 text-orange-500 font-bold text-sm hover:opacity-80">
                            <span class="material-symbols-outlined text-lg">thumb_up</span>
                            14 Likes
                        </button>
                        <button class="flex items-center gap-2 text-[#adaaad] hover:text-[#3f3f42] font-bold text-sm transition-colors">
                            <span class="material-symbols-outlined text-lg">share</span>
                            Compartir
                        </button>
                    </div>
                </div>
            </article>
        </div>
    </section>

    <!-- Edit Profile Modal Integration -->
    <EditProfileModal
      :isOpen="isEditModalOpen"
      :initialName="userName"
      :initialBio="userBio ?? undefined"
      @close="isEditModalOpen = false"
      @saved="isEditModalOpen = false"
    />
  </div>
</template>
