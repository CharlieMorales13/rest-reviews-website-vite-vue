<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useNotificationStore } from '../model/notificationStore';
import NotificationPanel from './NotificationPanel.vue';

const notifStore = useNotificationStore();
const showPanel = ref(false);
const bellRef = ref<HTMLElement | null>(null);

const onClickOutside = (e: MouseEvent) => {
  if (bellRef.value && !bellRef.value.contains(e.target as Node)) {
    showPanel.value = false;
  }
};

onMounted(() => document.addEventListener('click', onClickOutside));
onUnmounted(() => document.removeEventListener('click', onClickOutside));
</script>

<template>
  <div class="relative" ref="bellRef">
    <button
      class="relative flex items-center justify-center w-11 h-11 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
      aria-label="Notificaciones"
      @click.stop="showPanel = !showPanel"
    >
      <span class="material-symbols-outlined text-[#adaaad] text-xl">notifications</span>
      <span
        v-if="notifStore.unreadCount > 0"
        class="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-orange-500 text-white text-[10px] font-bold flex items-center justify-center px-1"
      >
        {{ notifStore.unreadCount > 9 ? '9+' : notifStore.unreadCount }}
      </span>
    </button>

    <Transition name="dropdown">
      <NotificationPanel v-if="showPanel" />
    </Transition>
  </div>
</template>
