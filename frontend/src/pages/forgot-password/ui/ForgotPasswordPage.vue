<script setup lang="ts">
import { ref } from "vue";
import { AuthService } from "@/entities/user/api/AuthService";

const email = ref("");
const loading = ref(false);
const sent = ref(false);
const error = ref("");

const handleSubmit = async () => {
  if (!email.value) return;
  loading.value = true;
  error.value = "";
  try {
    await AuthService.forgotPassword(email.value);
    sent.value = true;
  } catch {
    error.value = "Ocurrió un error. Intenta de nuevo.";
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
              src="/assets/images/logo.png"
              alt="Anáhuac EATS"
              class="h-20 w-auto"
            />
          </div>
          <h1 class="text-3xl font-bold tracking-tight text-white mb-2">
            ¿Olvidaste tu contraseña?
          </h1>
          <p class="text-white/60 text-sm">
            Te enviaremos un enlace para restablecerla
          </p>
        </div>

        <div v-if="sent" class="text-center space-y-6">
          <div
            class="p-6 bg-green-500/10 border border-green-500/20 rounded-2xl"
          >
            <p class="text-green-400 font-semibold mb-1">¡Correo enviado!</p>
            <p class="text-white/60 text-sm">
              Si tu correo está registrado, recibirás un enlace para restablecer
              tu contraseña. El enlace expira en
              <strong class="text-white/80">1 hora</strong>.
            </p>
          </div>
          <router-link
            to="/login"
            class="block text-anahuac-orange text-sm font-medium hover:underline"
          >
            Volver al inicio de sesión
          </router-link>
        </div>

        <form v-else @submit.prevent="handleSubmit" class="space-y-6">
          <div class="space-y-2">
            <label
              class="block text-xs font-medium text-white/50 ml-1 uppercase tracking-wider"
              >Correo electrónico</label
            >
            <div class="relative group">
              <span
                class="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold opacity-40 group-focus-within:opacity-100 transition-opacity text-white"
                >@</span
              >
              <input
                type="email"
                v-model="email"
                required
                placeholder="tu.correo@anahuac.mx"
                class="glass-input pl-10"
              />
            </div>
          </div>

          <div
            v-if="error"
            class="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm"
          >
            {{ error }}
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
              Enviando...
            </span>
            <span v-else>Enviar enlace</span>
          </button>

          <div class="text-center pt-2">
            <router-link
              to="/login"
              class="text-white/40 text-sm hover:text-white/70 transition-colors"
            >
              Volver al inicio de sesión
            </router-link>
          </div>
        </form>

        <div class="mt-8 pt-6 border-t border-white/10 text-center">
          <p class="text-white/40 text-xs">© 2026 Universidad Anáhuac</p>
        </div>
      </div>
    </div>
  </div>
</template>
