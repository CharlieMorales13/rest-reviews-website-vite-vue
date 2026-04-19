<script setup lang="ts">
import { useNotificationStore } from '../model/notificationStore';
import { useRouter } from 'vue-router';

const notifStore = useNotificationStore();
const router = useRouter();

const handleClick = async (id: string) => {
  await notifStore.markAsRead(id);
  router.push('/my-reviews');
};
</script>

<template>
  <div class="absolute right-0 mt-3 w-80 rounded-2xl overflow-hidden bg-[#1f1f22] border border-white/10 shadow-[0_20px_40px_rgba(0,0,0,0.5)] z-50">
    <div class="px-4 py-3 border-b border-white/5">
      <p class="text-sm font-bold text-white">Notificaciones</p>
    </div>

    <div v-if="notifStore.notifications.length === 0" class="px-4 py-6 text-center text-xs text-[#adaaad]">
      Sin notificaciones
    </div>

    <ul class="max-h-72 overflow-y-auto divide-y divide-white/5">
      <li
        v-for="n in notifStore.notifications"
        :key="n.id"
        class="flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-white/5"
        :class="n.isRead ? 'opacity-60' : ''"
        @click="handleClick(n.id)"
      >
        <span class="material-symbols-outlined text-orange-400 text-base mt-0.5 shrink-0">reply</span>
        <div class="min-w-0">
          <p class="text-xs text-white leading-snug">El gerente respondió tu reseña</p>
          <p class="text-[10px] text-[#adaaad] mt-0.5">{{ new Date(n.createdAt).toLocaleDateString('es-MX') }}</p>
        </div>
        <span v-if="!n.isRead" class="ml-auto mt-1.5 w-2 h-2 rounded-full bg-orange-500 shrink-0"></span>
      </li>
    </ul>
  </div>
</template>
