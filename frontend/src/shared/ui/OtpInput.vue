<script setup lang="ts">
import { ref, watch } from 'vue';

const props = defineProps<{ modelValue: string; disabled?: boolean }>();
const emit = defineEmits<{ (e: 'update:modelValue', v: string): void }>();

const digits = ref<string[]>(['', '', '', '', '', '']);
const inputs = ref<HTMLInputElement[]>([]);

watch(() => props.modelValue, (val) => {
  const chars = val.padEnd(6, '').slice(0, 6).split('');
  digits.value = chars;
});

const onInput = (index: number, event: Event) => {
  const target = event.target as HTMLInputElement;
  const val = target.value.replace(/\D/g, '').slice(-1);
  digits.value[index] = val;
  emit('update:modelValue', digits.value.join(''));
  if (val && index < 5) inputs.value[index + 1]?.focus();
};

const onKeydown = (index: number, event: KeyboardEvent) => {
  if (event.key === 'Backspace' && !digits.value[index] && index > 0) {
    inputs.value[index - 1]?.focus();
  }
};

const onPaste = (event: ClipboardEvent) => {
  const pasted = event.clipboardData?.getData('text').replace(/\D/g, '').slice(0, 6) ?? '';
  if (!pasted) return;
  event.preventDefault();
  pasted.split('').forEach((ch, i) => { digits.value[i] = ch; });
  emit('update:modelValue', digits.value.join(''));
  inputs.value[Math.min(pasted.length, 5)]?.focus();
};
</script>

<template>
  <div class="flex gap-3 justify-center">
    <input
      v-for="(_, i) in 6"
      :key="i"
      ref="inputs"
      type="text"
      inputmode="numeric"
      maxlength="1"
      :value="digits[i]"
      :disabled="disabled"
      @input="onInput(i, $event)"
      @keydown="onKeydown(i, $event)"
      @paste="onPaste"
      class="w-12 h-14 text-center text-2xl font-bold rounded-xl border-2 bg-white/5 text-white outline-none transition-all duration-200
             border-white/20 focus:border-anahuac-orange focus:bg-white/10
             disabled:opacity-40"
    />
  </div>
</template>
