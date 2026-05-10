<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { AuthService } from "@/entities/user/api/AuthService";

const route = useRoute();
const router = useRouter();

const token = ref("");
const newPassword = ref("");
const confirmPassword = ref("");
const showPassword = ref(false);
const loading = ref(false);
const error = ref("");
const tokenMissing = ref(false);

onMounted(() => {
  const t = route.query.token as string | undefined;
  if (!t) {
    tokenMissing.value = true;
    return;
  }
  token.value = t;
});

const handleSubmit = async () => {
  error.value = "";
  if (newPassword.value !== confirmPassword.value) {
    error.value = "Las contraseñas no coinciden.";
    return;
  }
  if (newPassword.value.length < 6) {
    error.value = "La contraseña debe tener al menos 6 caracteres.";
    return;
  }
  loading.value = true;
  try {
    await AuthService.resetPassword(token.value, newPassword.value);
    router.push("/login?reset=1");
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("expired") || msg.includes("inválido")) {
      error.value = "El enlace ha expirado o es inválido. Solicita uno nuevo.";
    } else {
      error.value = "Ocurrió un error. Intenta de nuevo.";
    }
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div
    class="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-black"
  >
    <div
      class="absolute inset-0 bg-cover bg-center blur-[1px] scale-105"
      style="
        background-image: url(&quot;/assets/images/university-bg.png&quot;);
      "
    ></div>
    <div
      class="absolute inset-0 bg-black/60 md:bg-black/50 lg:bg-gradient-to-r lg:from-black/80 lg:to-black/30"
    ></div>

    <div class="relative z-10 w-full max-w-md p-6 animate-fade-in">
      <div
        class="bg-white/5 backdrop-blur-2xl border border-white/20 rounded-[32px] p-8 md:p-12 shadow-2xl"
      >
        <div class="text-center mb-10">
          <div class="flex justify-center mb-6">
            <img
              src="/assets/images/imagotipo.png"
              alt="Anáhuac EATS"
              class="h-24 w-auto"
            />
          </div>
          <h1 class="text-3xl font-bold tracking-tight text-white mb-2">
            Nueva contraseña
          </h1>
          <p class="text-white/60 text-sm">
            Elige una contraseña segura para tu cuenta
          </p>
        </div>

        <div v-if="tokenMissing" class="text-center space-y-4">
          <div
            class="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm"
          >
            El enlace de restablecimiento no es válido.
          </div>
          <router-link
            to="/forgot-password"
            class="block text-anahuac-orange text-sm font-medium hover:underline"
          >
            Solicitar nuevo enlace
          </router-link>
        </div>

        <form v-else @submit.prevent="handleSubmit" class="space-y-6">
          <div class="space-y-2">
            <label
              class="block text-xs font-medium text-white/50 ml-1 uppercase tracking-wider"
              >Nueva contraseña</label
            >
            <div class="relative group">
              <span
                class="absolute left-4 top-1/2 -translate-y-1/2 text-lg opacity-40 group-focus-within:opacity-100 transition-opacity"
                >🔒</span
              >
              <input
                :type="showPassword ? 'text' : 'password'"
                v-model="newPassword"
                required
                placeholder="Mínimo 6 caracteres"
                class="glass-input pl-12 pr-12"
              />
              <button
                type="button"
                @click="showPassword = !showPassword"
                class="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors focus:outline-none"
                :aria-label="
                  showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'
                "
              >
                <svg
                  v-if="showPassword"
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path
                    d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"
                  />
                  <path
                    d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"
                  />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
                <svg
                  v-else
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </button>
            </div>
          </div>

          <div class="space-y-2">
            <label
              class="block text-xs font-medium text-white/50 ml-1 uppercase tracking-wider"
              >Confirmar contraseña</label
            >
            <div class="relative group">
              <span
                class="absolute left-4 top-1/2 -translate-y-1/2 text-lg opacity-40 group-focus-within:opacity-100 transition-opacity"
                >🔒</span
              >
              <input
                :type="showPassword ? 'text' : 'password'"
                v-model="confirmPassword"
                required
                placeholder="Repite tu nueva contraseña"
                class="glass-input pl-12"
              />
            </div>
          </div>

          <div
            v-if="error"
            class="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm"
          >
            {{ error }}
            <router-link
              v-if="error.includes('expirado')"
              to="/forgot-password"
              class="block mt-2 text-anahuac-orange hover:underline"
            >
              Solicitar nuevo enlace
            </router-link>
          </div>

          <button
            type="submit"
            class="btn-premium w-full mt-2"
            :disabled="loading"
          >
            <span v-if="loading" class="flex items-center justify-center gap-2">
              <div
                class="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"
              ></div>
              Guardando...
            </span>
            <span v-else>Guardar nueva contraseña</span>
          </button>
        </form>

        <div class="mt-8 pt-6 border-t border-white/10 text-center">
          <p class="text-white/40 text-xs">© 2026 Universidad Anáhuac</p>
        </div>
      </div>
    </div>
  </div>
</template>
