<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import QRCodeStyling from 'qr-code-styling';

const props = defineProps<{
  slug: string;
  establishmentName: string;
}>();

const containerRef = ref<HTMLElement | null>(null);
const qrUrl = `${window.location.origin}/r/${props.slug}`;

// SVG logo: orange circle with "AE" text, encoded as data URL
const logoDataUrl = `data:image/svg+xml;base64,${btoa(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <circle cx="50" cy="50" r="50" fill="#f97316"/>
  <text x="50" y="67" text-anchor="middle" font-family="Arial Black, Arial" font-weight="900" font-size="40" fill="white">AE</text>
</svg>
`)}`;

const qrCode = new QRCodeStyling({
  width: 420,
  height: 420,
  type: 'canvas',
  data: qrUrl,
  image: logoDataUrl,
  dotsOptions: {
    color: '#000000',
    type: 'rounded',
  },
  backgroundOptions: {
    color: '#ffffff',
  },
  cornersSquareOptions: {
    type: 'extra-rounded',
    color: '#000000',
  },
  cornersDotOptions: {
    type: 'dot',
    color: '#000000',
  },
  imageOptions: {
    crossOrigin: 'anonymous',
    margin: 6,
    imageSize: 0.28,
  },
  qrOptions: {
    errorCorrectionLevel: 'H',
  },
});

onMounted(() => {
  if (containerRef.value) qrCode.append(containerRef.value);
});

watch(() => props.slug, () => {
  qrCode.update({ data: `${window.location.origin}/r/${props.slug}` });
});

const downloading = ref(false);

const downloadPng = async () => {
  downloading.value = true;
  try {
    await qrCode.download({
      name: `qr-${props.slug}`,
      extension: 'png',
    });
  } finally {
    downloading.value = false;
  }
};
</script>

<template>
  <div class="bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col gap-5">
    <!-- Header -->
    <div>
      <p class="text-xs font-bold tracking-widest text-orange-500 uppercase mb-1">Código QR</p>
      <h3 class="text-xl font-black text-white brand leading-tight">Tu QR de Reseñas</h3>
      <p class="text-[#adaaad] text-sm mt-1">
        Imprime este código y colócalo en tu establecimiento para que los clientes dejen su reseña al instante.
      </p>
    </div>

    <!-- QR Canvas (oculto — necesario para que la descarga funcione) -->
    <div class="hidden" aria-hidden="true">
      <div ref="containerRef" />
    </div>

    <!-- Download button -->
    <button
      @click="downloadPng"
      :disabled="downloading"
      class="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-400 active:bg-orange-600 text-white font-bold text-sm transition-colors disabled:opacity-60"
    >
      <span class="material-symbols-outlined text-base">download</span>
      {{ downloading ? 'Descargando…' : 'Descargar PNG' }}
    </button>

    <p class="text-xs text-[#adaaad]/60 text-center leading-snug">
      El PNG viene en alta resolución, listo para imprimir en cualquier tamaño.
    </p>
  </div>
</template>
