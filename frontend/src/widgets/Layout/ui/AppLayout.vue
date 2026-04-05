<script setup lang="ts">
import { computed, ref } from 'vue';
import { useAuthStore } from '@/entities/user/model/authStore';
import { useRoute, useRouter } from 'vue-router';

const authStore = useAuthStore();
const router = useRouter();
const route = useRoute();

const userName = computed(() => authStore.user?.name || 'Usuario');
const userInitials = computed(() => {
  const nameParts = userName.value.split(' ');
  if (nameParts.length >= 2 && nameParts[0] && nameParts[1]) {
    return (nameParts[0][0] || '') + (nameParts[1][0] || '');
  }
  return (nameParts[0] || '').substring(0, 2).toUpperCase();
});

const showDropdown = ref(false);

const logout = () => {
  authStore.logout();
  router.push('/login');
};
</script>

<<template>
  <div class="min-h-screen bg-background text-on-surface font-sans flex flex-col">
    <!-- TopNavBar (Stitch Export) -->
    <nav class="fixed top-0 w-full z-50 bg-[#0e0e10]/80 backdrop-blur-xl border-b border-[#48474a]/15 shadow-[0_20px_40px_rgba(0,0,0,0.4)]">
      <div class="flex justify-between items-center h-20 px-8 w-full max-w-none">
        
        <div class="flex items-center space-x-2">
            <!-- Simplified Brand without image, as requested by user in last prompt: "elimina el logo del Nagbar; únicamente mantén el nombre" -->
            <router-link to="/dashboard" class="text-2xl font-black tracking-tighter text-orange-500 brand hover:opacity-80 transition-opacity">
                Anáhuac EATS
            </router-link>
        </div>
        
        <div class="hidden md:flex items-center space-x-8 font-['Manrope'] tracking-tight">
          <router-link 
            to="/dashboard" 
            class="transition-colors border-b-2 pb-1"
            :class="route.path.includes('/dashboard') ? 'text-orange-500 font-bold border-orange-500' : 'text-[#adaaad] hover:text-[#f9f5f8] border-transparent font-medium'"
          >
            Inicio
          </router-link>
          <router-link 
            to="/my-reviews" 
            class="transition-colors border-b-2 pb-1"
            :class="route.path.includes('/my-reviews') ? 'text-orange-500 font-bold border-orange-500' : 'text-[#adaaad] hover:text-[#f9f5f8] border-transparent font-medium'"
          >
            Mis Reseñas
          </router-link>
        </div>
        
        <div class="flex items-center space-x-6">
          <router-link to="/create-review" class="bg-gradient-to-r from-primary to-primary-container text-on-primary font-bold py-2.5 px-6 rounded-lg shadow-lg hover:brightness-110 active:scale-95 transition-all duration-200">
            Crear Reseña
          </router-link>
          
          <!-- Dropdown using the stitched avatar look -->
          <div class="relative">
            <div class="flex items-center space-x-3 cursor-pointer group" @click="showDropdown = !showDropdown">
              <div class="w-10 h-10 rounded-full overflow-hidden border-2 border-transparent group-hover:border-primary transition-all bg-surface-variant flex flex-col justify-center items-center text-primary font-bold">
                {{ userInitials }}
              </div>
              <span class="material-symbols-outlined text-[#adaaad] group-hover:text-white transition-colors">person</span>
            </div>

            <!-- Dropdown Menu -->
            <div v-if="showDropdown" class="absolute right-0 mt-4 w-56 rounded-xl overflow-hidden py-2 bg-surface-container-high border border-outline-variant/15 shadow-ambient origin-top-right animate-fade-in z-50">
                <div class="px-5 py-4 mb-2 bg-surface-container-lowest">
                    <p class="text-sm font-bold text-on-surface">{{ userName }}</p>
                    <p class="text-xs text-on-surface-variant truncate mt-1">Student</p>
                </div>
                <router-link to="/profile" class="flex items-center gap-3 px-5 py-2.5 text-sm text-on-surface-variant hover:text-orange-500 hover:bg-surface transition-colors" @click="showDropdown = false">
                    <span class="material-symbols-outlined text-lg">badge</span>
                    View Profile
                </router-link>
                <div class="border-t border-outline-variant/10 my-1"></div>
                <button @click="logout" class="w-full flex items-center gap-3 px-5 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors text-left">
                    <span class="material-symbols-outlined text-lg">logout</span>
                    Sign Out
                </button>
            </div>
          </div>
        </div>
      </div>
    </nav>

    <!-- Main Content Area -->
    <main class="flex-1 w-full pt-20">
      <router-view />
    </main>

    <!-- Footer (Stitch Export) -->
    <footer class="bg-[#0e0e10] w-full py-12 px-8 font-['Inter'] text-sm mt-auto border-t border-[#48474a]/15">
        <div class="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
            <div class="flex flex-col items-center md:items-start gap-2">
                <div class="text-orange-500 font-bold text-xl brand hover:opacity-80 transition-opacity cursor-pointer">Anáhuac Dining</div>
                <p class="text-[#adaaad] text-center md:text-left">© 2024 Anáhuac Oaxaca. Editorial Excellence in Dining.</p>
            </div>
            
            <div class="flex flex-wrap justify-center gap-8">
                <a class="text-[#adaaad] hover:text-orange-400 underline decoration-orange-500/30 transition-all font-medium" href="#">Privacy Policy</a>
                <a class="text-[#adaaad] hover:text-orange-400 underline decoration-orange-500/30 transition-all font-medium" href="#">Terms of Service</a>
                <a class="text-[#adaaad] hover:text-orange-400 underline decoration-orange-500/30 transition-all font-medium" href="#">Campus Map</a>
                <a class="text-[#adaaad] hover:text-orange-400 underline decoration-orange-500/30 transition-all font-medium" href="#">Contact Support</a>
            </div>
            
            <div class="flex gap-4">
                <div class="w-10 h-10 rounded-full bg-[#131315] flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-surface-variant cursor-pointer transition-all">
                    <span class="material-symbols-outlined text-lg">language</span>
                </div>
                <div class="w-10 h-10 rounded-full bg-[#131315] flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-surface-variant cursor-pointer transition-all">
                    <span class="material-symbols-outlined text-lg">share</span>
                </div>
            </div>
        </div>
        <div class="mt-8 pt-8 border-t border-outline-variant/10 text-center text-[#adaaad]/40 text-xs tracking-wider">
            Powered by Anáhuac Oaxaca Digital Excellence System
        </div>
    </footer>

  </div>
</template>

<style scoped>
/* Scoped styles are mostly handled by tailwind classes */
</style>
