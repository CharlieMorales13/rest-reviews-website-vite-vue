<script setup lang="ts">
import { useToast } from '@/shared/lib/useToast';

const { toasts } = useToast();
</script>

<template>
    <Teleport to="body">
        <div class="fixed top-5 right-5 z-[9999] flex flex-col gap-3 pointer-events-none">
            <Transition
                v-for="toast in toasts"
                :key="toast.id"
                appear
                enter-active-class="transition-all duration-300 ease-out"
                enter-from-class="opacity-0 translate-x-8"
                enter-to-class="opacity-100 translate-x-0"
                leave-active-class="transition-all duration-200 ease-in"
                leave-from-class="opacity-100 translate-x-0"
                leave-to-class="opacity-0 translate-x-8"
            >
                <div
                    class="flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl text-sm font-bold pointer-events-auto min-w-[260px] max-w-sm border"
                    :class="{
                        'bg-emerald-500/10 border-emerald-500/30 text-emerald-400': toast.type === 'success',
                        'bg-red-500/10 border-red-500/30 text-red-400': toast.type === 'error',
                        'bg-blue-500/10 border-blue-500/30 text-blue-400': toast.type === 'info',
                    }"
                >
                    <span
                        class="material-symbols-outlined text-lg shrink-0"
                        style="font-variation-settings: 'FILL' 1;"
                    >
                        {{ toast.type === 'success' ? 'check_circle' : toast.type === 'error' ? 'error' : 'info' }}
                    </span>
                    <span class="leading-snug">{{ toast.message }}</span>
                </div>
            </Transition>
        </div>
    </Teleport>
</template>
