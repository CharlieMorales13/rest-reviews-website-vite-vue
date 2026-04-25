import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { supabase } from '@/shared/api/supabaseClient';
import { NotificationService } from '../api/NotificationService';
import { useAuthStore } from '@/entities/user/model/authStore';
import type { Notification } from './types';
import type { RealtimeChannel } from '@supabase/supabase-js';

export const useNotificationStore = defineStore('notifications', () => {
  const notifications = ref<Notification[]>([]);
  const unreadCount = computed(() => notifications.value.filter(n => !n.isRead).length);
  let channel: RealtimeChannel | null = null;

  const load = async () => {
    notifications.value = await NotificationService.getAll();
  };

  const markAsRead = async (id: string) => {
    await NotificationService.markAsRead(id);
    const n = notifications.value.find(n => n.id === id);
    if (n) n.isRead = true;
  };

  const subscribe = (userId: string) => {
    channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const row = payload.new as any;
          notifications.value.unshift({
            id: row.id,
            reviewId: row.review_id,
            type: row.type,
            isRead: row.is_read,
            createdAt: row.created_at,
            actorName: row.actor_name ?? null,
          });
        }
      )
      .subscribe();
  };

  const unsubscribe = () => {
    channel?.unsubscribe();
    channel = null;
  };

  const init = async () => {
    const authStore = useAuthStore();
    if (!authStore.user?.id) return;
    await load();
    subscribe(authStore.user.id);
  };

  return { notifications, unreadCount, load, markAsRead, subscribe, unsubscribe, init };
});
