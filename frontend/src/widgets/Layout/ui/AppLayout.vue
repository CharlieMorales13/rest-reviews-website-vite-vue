<script setup lang="ts">
import { computed, ref, watch, onMounted, onUnmounted } from 'vue';
import { useAuthStore } from '@/entities/user/model/authStore';
import { useRoute, useRouter } from 'vue-router';
import NotificationBell from '@/entities/notification/ui/NotificationBell.vue';
import { useNotificationStore } from '@/entities/notification/model/notificationStore';

const authStore = useAuthStore();
const router = useRouter();
const route = useRoute();

const notifStore = useNotificationStore();

const userName = computed(() => authStore.user?.name || 'Usuario');
const userInitials = computed(() => {
  const parts = userName.value.split(' ');
  if (parts.length >= 2 && parts[0] && parts[1]) {
    return (parts[0][0] || '') + (parts[1][0] || '');
  }
  return (parts[0] || '').substring(0, 2).toUpperCase();
});

const showDropdown = ref(false);
const mobileMenuOpen = ref(false);
const dropdownRef = ref<HTMLElement | null>(null);

// Close dropdown on click outside
const onClickOutside = (e: MouseEvent) => {
  if (dropdownRef.value && !dropdownRef.value.contains(e.target as Node)) {
    showDropdown.value = false;
  }
};
onMounted(async () => {
  document.addEventListener('click', onClickOutside);
  if (authStore.user?.role === 'student') {
    await notifStore.init();
  }
});

onUnmounted(() => {
  document.removeEventListener('click', onClickOutside);
  notifStore.unsubscribe();
});

// Close menus on route change
watch(() => route.path, () => {
  showDropdown.value = false;
  mobileMenuOpen.value = false;
});

// Lock body scroll when mobile menu is open
watch(mobileMenuOpen, (isOpen) => {
  if (isOpen) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = '';
  }
});

const logout = () => {
  authStore.logout();
  router.push('/login');
};

const isActive = (path: string) => route.path === path || route.path.startsWith(path + '/');
</script>

<template>
  <div class="min-h-screen bg-[#0e0e10] text-[#f9f5f8] font-sans flex flex-col">

    <!-- Top Nav -->
    <nav class="fixed top-0 w-full z-50 bg-[#0e0e10]/85 backdrop-blur-xl border-b border-white/5 shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
      <div class="flex justify-between items-center h-20 md:h-28 px-4 md:px-10">

        <!-- Brand -->
        <router-link to="/dashboard" class="text-2xl md:text-3xl font-black tracking-tighter text-orange-500 brand hover:opacity-80 transition-opacity">
          Anáhuac EATS
        </router-link>

        <!-- Desktop Nav Links -->
        <div class="hidden md:flex items-center space-x-10 font-['Manrope'] tracking-tight">
          <router-link
            v-if="authStore.user?.role === 'student'"
            to="/dashboard"
            class="transition-colors border-b-2 pb-1 text-lg font-semibold"
            :class="isActive('/dashboard') ? 'text-orange-500 font-bold border-orange-500' : 'text-[#adaaad] hover:text-white border-transparent'"
          >
            Inicio
          </router-link>
          <router-link
            v-if="authStore.user?.role === 'student'"
            to="/my-reviews"
            class="transition-colors border-b-2 pb-1 text-lg font-semibold"
            :class="isActive('/my-reviews') ? 'text-orange-500 font-bold border-orange-500' : 'text-[#adaaad] hover:text-white border-transparent'"
          >
            Mis Reseñas
          </router-link>
          <router-link
            v-if="authStore.user?.role === 'admin'"
            to="/admin"
            class="transition-colors border-b-2 pb-1 text-lg font-semibold"
            :class="isActive('/admin') ? 'text-orange-500 font-bold border-orange-500' : 'text-[#adaaad] hover:text-white border-transparent'"
          >
            Panel de Administrador
          </router-link>
          <router-link
            v-if="authStore.user?.role === 'manager'"
            to="/manager"
            class="transition-colors border-b-2 pb-1 text-lg font-semibold"
            :class="route.path === '/manager' ? 'text-orange-500 font-bold border-orange-500' : 'text-[#adaaad] hover:text-white border-transparent'"
          >
            Mi Panel
          </router-link>
          <router-link
            v-if="authStore.user?.role === 'manager'"
            to="/manager/mi-establecimiento"
            class="transition-colors border-b-2 pb-1 text-lg font-semibold"
            :class="isActive('/manager/mi-establecimiento') ? 'text-orange-500 font-bold border-orange-500' : 'text-[#adaaad] hover:text-white border-transparent'"
          >
            Mi Establecimiento
          </router-link>
        </div>

        <!-- Desktop Right Actions -->
        <div class="hidden md:flex items-center space-x-4">

          <!-- Bell — students only -->
          <NotificationBell v-if="authStore.user?.role === 'student'" />

          <!-- User Dropdown -->
          <div class="relative" ref="dropdownRef">
            <button
              class="flex items-center space-x-2 cursor-pointer group"
              @click="showDropdown = !showDropdown"
              aria-label="Menú de usuario"
            >
              <div class="w-11 h-11 rounded-full bg-orange-500/20 border border-orange-500/40 group-hover:border-orange-500 transition-all flex items-center justify-center text-orange-400 font-bold text-base">
                {{ userInitials }}
              </div>
            </button>

            <Transition name="dropdown">
              <div
                v-if="showDropdown"
                class="absolute right-0 mt-3 w-52 rounded-2xl overflow-hidden bg-[#1f1f22] border border-white/10 shadow-[0_20px_40px_rgba(0,0,0,0.5)] z-50"
              >
                <div class="px-4 py-4 border-b border-white/5">
                  <p class="text-sm font-bold text-white">{{ userName }}</p>
                  <p class="text-xs text-[#adaaad] mt-0.5 capitalize">{{ authStore.user?.role || 'student' }}</p>
                </div>
                <router-link
                  to="/profile"
                  class="flex items-center gap-3 px-4 py-3 text-sm text-[#adaaad] hover:text-orange-400 hover:bg-white/5 transition-colors"
                  @click="showDropdown = false"
                >
                  <span class="material-symbols-outlined text-base">badge</span>
                  Ver Perfil
                </router-link>
                <div class="border-t border-white/5"></div>
                <button
                  @click="logout"
                  class="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors text-left"
                >
                  <span class="material-symbols-outlined text-base">logout</span>
                  Cerrar Sesión
                </button>
              </div>
            </Transition>
          </div>
        </div>

        <!-- Mobile: User initials + Hamburger -->
        <div class="flex md:hidden items-center gap-3">
          <div class="w-9 h-9 rounded-full bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400 font-bold text-sm">
            {{ userInitials }}
          </div>
          <button
            @click="mobileMenuOpen = !mobileMenuOpen"
            class="w-9 h-9 flex flex-col items-center justify-center gap-1.5 rounded-lg hover:bg-white/5 transition-colors"
            aria-label="Menú"
          >
            <span
              class="block w-5 h-0.5 bg-[#f9f5f8] transition-all duration-300 origin-center"
              :class="mobileMenuOpen ? 'rotate-45 translate-y-2' : ''"
            ></span>
            <span
              class="block w-5 h-0.5 bg-[#f9f5f8] transition-all duration-300"
              :class="mobileMenuOpen ? 'opacity-0 scale-x-0' : ''"
            ></span>
            <span
              class="block w-5 h-0.5 bg-[#f9f5f8] transition-all duration-300 origin-center"
              :class="mobileMenuOpen ? '-rotate-45 -translate-y-2' : ''"
            ></span>
          </button>
        </div>
      </div>

      <!-- Mobile Menu Drawer -->
      <Transition name="mobile-menu">
        <div
          v-if="mobileMenuOpen"
          class="md:hidden border-t border-white/5 bg-[#0e0e10]/95 backdrop-blur-xl"
        >
          <div class="px-4 py-4 space-y-1">
            <router-link
              v-if="authStore.user?.role === 'student'"
              to="/dashboard"
              class="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors"
              :class="isActive('/dashboard') ? 'bg-orange-500/10 text-orange-400' : 'text-[#adaaad] hover:bg-white/5 hover:text-white'"
            >
              <span class="material-symbols-outlined text-base">home</span>
              Inicio
            </router-link>
            <router-link
              v-if="authStore.user?.role === 'student'"
              to="/my-reviews"
              class="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors"
              :class="isActive('/my-reviews') ? 'bg-orange-500/10 text-orange-400' : 'text-[#adaaad] hover:bg-white/5 hover:text-white'"
            >
              <span class="material-symbols-outlined text-base">rate_review</span>
              Mis Reseñas
            </router-link>
            <router-link
              v-if="authStore.user?.role === 'admin'"
              to="/admin"
              class="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors"
              :class="isActive('/admin') ? 'bg-orange-500/10 text-orange-400' : 'text-[#adaaad] hover:bg-white/5 hover:text-white'"
            >
              <span class="material-symbols-outlined text-base">admin_panel_settings</span>
              Panel Admin
            </router-link>
            <router-link
              v-if="authStore.user?.role === 'manager'"
              to="/manager"
              class="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors"
              :class="route.path === '/manager' ? 'bg-orange-500/10 text-orange-400' : 'text-[#adaaad] hover:bg-white/5 hover:text-white'"
            >
              <span class="material-symbols-outlined text-base">dashboard</span>
              Mi Panel
            </router-link>
            <router-link
              v-if="authStore.user?.role === 'manager'"
              to="/manager/mi-establecimiento"
              class="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors"
              :class="isActive('/manager/mi-establecimiento') ? 'bg-orange-500/10 text-orange-400' : 'text-[#adaaad] hover:bg-white/5 hover:text-white'"
            >
              <span class="material-symbols-outlined text-base">storefront</span>
              Mi Establecimiento
            </router-link>
            <router-link
              to="/profile"
              class="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors"
              :class="isActive('/profile') ? 'bg-orange-500/10 text-orange-400' : 'text-[#adaaad] hover:bg-white/5 hover:text-white'"
            >
              <span class="material-symbols-outlined text-base">badge</span>
              Ver Perfil
            </router-link>
          </div>
          <div class="px-4 pb-4 pt-1 border-t border-white/5 mt-1">
            <div class="px-4 py-2 mb-2">
              <p class="text-sm font-semibold text-white">{{ userName }}</p>
              <p class="text-xs text-[#adaaad] capitalize">{{ authStore.user?.role || 'student' }}</p>
            </div>
            <button
              @click="logout"
              class="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition-colors text-left"
            >
              <span class="material-symbols-outlined text-base">logout</span>
              Cerrar Sesión
            </button>
          </div>
        </div>
      </Transition>
    </nav>

    <!-- Main Content -->
    <main class="flex-1 w-full pt-20 md:pt-28">
      <router-view v-slot="{ Component }">
        <transition name="fade-scale" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <!-- Footer -->
    <footer class="bg-[#0e0e10] w-full py-10 px-6 md:px-8 text-sm mt-auto border-t border-white/5">
      <div class="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
        <div class="flex flex-col items-center md:items-start gap-1">
          <div class="text-orange-500 font-bold text-lg brand">Anáhuac EATS</div>
          <p class="text-[#adaaad] text-xs text-center md:text-left">© 2026 Universidad Anáhuac Oaxaca</p>
        </div>

        <div class="flex flex-wrap justify-center gap-6">
          <a class="text-[#adaaad] hover:text-orange-400 transition-colors text-xs font-medium" href="#">Privacidad</a>
          <a class="text-[#adaaad] hover:text-orange-400 transition-colors text-xs font-medium" href="#">Términos</a>
          <a class="text-[#adaaad] hover:text-orange-400 transition-colors text-xs font-medium" href="#">Campus</a>
          <a class="text-[#adaaad] hover:text-orange-400 transition-colors text-xs font-medium" href="#">Soporte</a>
        </div>
      </div>
    </footer>

  </div>
</template>

<style scoped>
.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-6px) scale(0.97);
}

.mobile-menu-enter-active,
.mobile-menu-leave-active {
  transition: opacity 0.2s ease, max-height 0.25s ease;
  max-height: 400px;
  overflow: hidden;
}
.mobile-menu-enter-from,
.mobile-menu-leave-to {
  opacity: 0;
  max-height: 0;
}

/* Page Transition (Fade & Scale) */
.fade-scale-enter-active,
.fade-scale-leave-active {
  transition: opacity 0.3s ease, transform 0.3s cubic-bezier(0.22, 1, 0.36, 1);
}

.fade-scale-enter-from {
  opacity: 0;
  transform: scale(0.98);
}

.fade-scale-leave-to {
  opacity: 0;
  transform: scale(0.98);
}
</style>
