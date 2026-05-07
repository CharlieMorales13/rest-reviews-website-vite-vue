<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '@/entities/user/model/authStore';
import OtpInput from '@/shared/ui/OtpInput.vue';

const authStore = useAuthStore();
const router = useRouter();
const route = useRoute();

const email = computed(() => (route.query.email as string) ?? '');
const redirect = computed(() => (route.query.redirect as string) ?? '');

const code = ref('');
const loading = ref(false);
const resendCooldown = ref(0);
let cooldownTimer: ReturnType<typeof setInterval> | null = null;

onMounted(() => {
  if (!email.value) router.replace('/register');
});

const handleVerify = async () => {
  if (code.value.length !== 6) return;
  loading.value = true;
  try {
    await authStore.verifyEmail(email.value, code.value);
    const role = authStore.userRole ?? 'student';
    const dest = redirect.value || (role === 'admin' ? '/admin' : role === 'manager' ? '/manager' : '/dashboard');
    router.push(dest);
  } finally {
    loading.value = false;
  }
};

const handleResend = async () => {
  if (resendCooldown.value > 0) return;
  try {
    await authStore.resendVerification(email.value);
    resendCooldown.value = 60;
    cooldownTimer = setInterval(() => {
      resendCooldown.value--;
      if (resendCooldown.value <= 0 && cooldownTimer) {
        clearInterval(cooldownTimer);
        cooldownTimer = null;
      }
    }, 1000);
  } catch {
    // Silently ignore — server hides existence of email
  }
};

function maskEmail(e: string): string {
  const [local, domain] = e.split('@');
  if (!domain) return e;
  const masked = local.length <= 2 ? local[0] + '*' : local[0] + '*'.repeat(local.length - 2) + local[local.length - 1];
  return `${masked}@${domain}`;
}
</script>

<template>
  <div class="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-black">
    <div
      class="absolute inset-0 bg-cover bg-center blur-[1px] scale-105"
      style="background-image: url('/assets/images/university-bg.png');"
    ></div>
    <div class="absolute inset-0 bg-black/60"></div>

    <div class="relative z-10 w-full max-w-md p-6 animate-fade-in">
      <div class="bg-white/5 backdrop-blur-2xl border border-white/20 rounded-[32px] p-8 md:p-12 shadow-2xl text-center">
        <div class="inline-flex items-center gap-2 px-4 py-2 bg-anahuac-orange/20 border border-anahuac-orange/30 rounded-full mb-6">
          <span class="text-anahuac-orange font-extrabold text-lg tracking-tight brand">Anáhuac EATS</span>
        </div>

        <h1 class="text-2xl font-bold text-white mb-2">Verifica tu correo</h1>
        <p class="text-white/60 text-sm mb-2">
          Enviamos un código de 6 dígitos a
        </p>
        <p class="text-white font-semibold text-sm mb-8">{{ maskEmail(email) }}</p>

        <form @submit.prevent="handleVerify" class="space-y-6">
          <OtpInput v-model="code" :disabled="loading" />

          <p v-if="authStore.error" class="text-red-400 text-sm">{{ authStore.error }}</p>

          <button
            type="submit"
            :disabled="code.length !== 6 || loading"
            class="w-full py-3.5 rounded-2xl font-bold text-white transition-all duration-300
                   bg-anahuac-orange hover:bg-orange-500 active:scale-95
                   disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {{ loading ? 'Verificando…' : 'Verificar cuenta' }}
          </button>
        </form>

        <div class="mt-6 text-sm text-white/50">
          ¿No recibiste el código?
          <button
            @click="handleResend"
            :disabled="resendCooldown > 0"
            class="ml-1 text-anahuac-orange hover:underline disabled:text-white/30 disabled:no-underline disabled:cursor-not-allowed"
          >
            {{ resendCooldown > 0 ? `Reenviar en ${resendCooldown}s` : 'Reenviar código' }}
          </button>
        </div>

        <p class="mt-4 text-xs text-white/30">El código expira en 15 minutos.</p>
      </div>
    </div>
  </div>
</template>
