<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { httpClient } from '@/shared/api/httpClient';
import { AdminService, type AdminUser } from '@/entities/user/api/AdminService';
import CreateUserModal from './CreateUserModal.vue';

// ML Pipeline
const pipelineRunning = ref(false);
const pipelineResult = ref<{ accuracy?: number; f1Score?: number; ige_global?: number; sentiment_label?: string } | null>(null);
const pipelineError = ref<string | null>(null);

const runPipeline = async () => {
  pipelineRunning.value = true;
  pipelineResult.value = null;
  pipelineError.value = null;
  try {
    const res = await httpClient.post<{ success: boolean; data: any }>('/api/metrics/run');
    pipelineResult.value = res.data.data;
  } catch (e: any) {
    pipelineError.value = e?.response?.data?.message || 'Error al ejecutar el pipeline.';
  } finally {
    pipelineRunning.value = false;
  }
};

// System Metrics
const systemMetrics = ref([
  { id: '1', title: 'Cuentas Totales', value: '—', icon: 'group', color: 'orange-500' },
  { id: '2', title: 'Establecimientos Activos', value: '4', icon: 'storefront', color: 'blue-500' },
  { id: '3', title: 'Reseñas Procesadas', value: '—', icon: 'reviews', color: 'emerald-500' },
  { id: '4', title: 'Salud de Endpoints API', value: '100%', icon: 'monitor_heart', color: 'purple-500' },
]);

// Users
const users = ref<AdminUser[]>([]);
const usersLoading = ref(true);

const loadUsers = async () => {
  usersLoading.value = true;
  try {
    users.value = await AdminService.listUsers();
    systemMetrics.value[0].value = users.value.length.toString();
  } catch {
    // silently keep empty
  } finally {
    usersLoading.value = false;
  }
};

onMounted(() => loadUsers());

// Create User Modal
const showCreateModal = ref(false);

const onUserCreated = (user: { name: string; email: string; role: string }) => {
  loadUsers();
};

// Endpoints Status
const endpoints = ref([
  { method: 'GET', path: '/api/v1/establishments', status: 200, latency: '45ms' },
  { method: 'POST', path: '/api/v1/reviews', status: 201, latency: '120ms' },
  { method: 'PATCH', path: '/api/v1/reviews/:id/reply', status: 200, latency: '85ms' },
  { method: 'GET', path: '/api/v1/metrics/dashboard', status: 200, latency: '210ms' },
  { method: 'POST', path: '/api/v1/auth/register', status: 201, latency: '300ms' },
]);

const getMethodColor = (method: string) => {
  switch(method) {
    case 'GET': return 'text-emerald-600 bg-emerald-50';
    case 'POST': return 'text-blue-600 bg-blue-50';
    case 'PATCH': return 'text-amber-600 bg-amber-50';
    case 'DELETE': return 'text-red-600 bg-red-50';
    default: return 'text-gray-600 bg-gray-50';
  }
};
</script>

<template>
  <div class="w-full max-w-7xl mx-auto px-6 lg:px-12 py-12 animate-fade-in relative z-10">
    
    <!-- Header -->
    <header class="mb-12 border-b border-white/5 pb-8">
      <div class="flex items-center gap-3 mb-2">
        <span class="material-symbols-outlined text-orange-500">admin_panel_settings</span>
        <span class="text-orange-500 font-bold tracking-widest uppercase text-sm">Super Admin Portal</span>
      </div>
      <h1 class="text-4xl lg:text-5xl font-black text-white brand tracking-tight">
        Panel de Administración Global
      </h1>
      <p class="text-[#adaaad] mt-4 max-w-2xl text-lg">
        Control total del sistema: Gestión de cuentas, auditoría de establecimientos y monitoreo en tiempo real de los endpoints del backend.
      </p>
    </header>

    <!-- Metrics Grid -->
    <section class="mb-16">
      <h2 class="text-2xl font-bold tracking-tight text-white mb-6 brand">Estado del Sistema</h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div 
          v-for="metric in systemMetrics" 
          :key="metric.id"
          class="card-cream rounded-[1.5rem] p-6 shadow-sm flex flex-col gap-4 border border-black/5 relative overflow-hidden group transition-all hover:shadow-xl hover:-translate-y-1"
        >
          <!-- Glow -->
          <div :class="`absolute -top-10 -right-10 w-24 h-24 bg-${metric.color}/10 rounded-full blur-2xl group-hover:bg-${metric.color}/20 transition-colors`"></div>
          
          <div :class="`w-12 h-12 rounded-xl bg-white border border-black/5 text-${metric.color} flex items-center justify-center shadow-sm z-10`">
            <span class="material-symbols-outlined text-2xl" style="font-variation-settings: 'FILL' 1;">{{ metric.icon }}</span>
          </div>
          <div class="z-10">
            <h3 class="text-[#525155] text-xs font-bold mb-1 uppercase tracking-widest">{{ metric.title }}</h3>
            <div class="flex items-baseline gap-1">
              <span class="text-3xl font-black text-[#0e0e10] brand leading-none">{{ metric.value }}</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ML Pipeline Section -->
    <section class="mb-16">
      <h2 class="text-2xl font-bold tracking-tight text-white mb-6 brand">Motor de Inteligencia Artificial</h2>
      <div class="card-cream rounded-[1.5rem] p-8 border border-black/5 shadow-xl">
        <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div class="flex items-start gap-5">
            <div class="w-14 h-14 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center flex-shrink-0">
              <span class="material-symbols-outlined text-orange-500 text-3xl" style="font-variation-settings: 'FILL' 1;">model_training</span>
            </div>
            <div>
              <h3 class="text-xl font-black text-[#0e0e10] brand mb-1">Pipeline de Análisis de Sentimiento</h3>
              <p class="text-[#525155] text-sm max-w-lg">
                Procesa todas las reseñas activas, clasifica sentimiento (TF-IDF + Regresión Logística),
                actualiza los índices IGE por establecimiento y registra métricas del modelo.
              </p>
              <div class="flex flex-wrap gap-2 mt-3">
                <span class="text-[10px] font-bold uppercase tracking-widest bg-orange-100 text-orange-600 px-2.5 py-1 rounded-full border border-orange-200">TF-IDF</span>
                <span class="text-[10px] font-bold uppercase tracking-widest bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full border border-blue-100">Logistic Regression</span>
                <span class="text-[10px] font-bold uppercase tracking-widest bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-full border border-emerald-100">scikit-learn</span>
              </div>
            </div>
          </div>

          <button
            @click="runPipeline"
            :disabled="pipelineRunning"
            class="flex-shrink-0 flex items-center gap-3 px-7 py-3.5 rounded-2xl font-bold text-sm transition-all duration-200 active:scale-95 disabled:cursor-not-allowed"
            :class="pipelineRunning
              ? 'bg-orange-100 text-orange-400 border border-orange-200'
              : 'bg-orange-500 hover:bg-orange-400 text-white shadow-lg shadow-orange-500/25 hover:shadow-orange-400/30'"
          >
            <span
              class="material-symbols-outlined text-xl"
              :class="pipelineRunning ? 'animate-spin' : ''"
              style="font-variation-settings: 'FILL' 1;"
            >
              {{ pipelineRunning ? 'progress_activity' : 'play_circle' }}
            </span>
            {{ pipelineRunning ? 'Procesando...' : 'Ejecutar Pipeline' }}
          </button>
        </div>

        <!-- Result -->
        <Transition name="fade">
          <div v-if="pipelineResult" class="mt-6 pt-6 border-t border-black/5">
            <p class="text-xs font-bold uppercase tracking-widest text-[#adaaad] mb-4">Resultado del último entrenamiento</p>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div class="bg-white rounded-2xl p-4 border border-black/5 text-center">
                <p class="text-2xl font-black text-[#0e0e10] brand">{{ ((pipelineResult.accuracy ?? 0) * 100).toFixed(1) }}%</p>
                <p class="text-xs text-[#adaaad] font-semibold mt-1">Accuracy</p>
              </div>
              <div class="bg-white rounded-2xl p-4 border border-black/5 text-center">
                <p class="text-2xl font-black text-[#0e0e10] brand">{{ ((pipelineResult.f1Score ?? 0) * 100).toFixed(1) }}%</p>
                <p class="text-xs text-[#adaaad] font-semibold mt-1">F1 Score</p>
              </div>
              <div class="bg-white rounded-2xl p-4 border border-black/5 text-center">
                <p class="text-2xl font-black text-orange-500 brand">{{ (pipelineResult.ige_global ?? 0).toFixed(1) }}</p>
                <p class="text-xs text-[#adaaad] font-semibold mt-1">IGE Global</p>
              </div>
              <div class="bg-white rounded-2xl p-4 border border-black/5 text-center">
                <p class="text-lg font-black text-[#0e0e10] brand capitalize">{{ pipelineResult.sentiment_label ?? '—' }}</p>
                <p class="text-xs text-[#adaaad] font-semibold mt-1">Sentimiento</p>
              </div>
            </div>
          </div>
        </Transition>

        <!-- Error -->
        <Transition name="fade">
          <div v-if="pipelineError" class="mt-6 pt-6 border-t border-black/5">
            <div class="flex items-center gap-3 p-4 bg-red-50 rounded-2xl border border-red-100">
              <span class="material-symbols-outlined text-red-500">error</span>
              <p class="text-sm text-red-600 font-medium">{{ pipelineError }}</p>
            </div>
          </div>
        </Transition>
      </div>
    </section>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      
      <!-- Cuentas de Usuario (2/3 width) -->
      <section class="lg:col-span-2">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-2xl font-bold tracking-tight text-white brand">Directorio de Cuentas</h2>
          <button
            @click="showCreateModal = true"
            class="bg-orange-500 hover:bg-orange-400 text-white text-sm font-semibold py-2 px-4 rounded-lg transition-colors flex items-center gap-2 shadow-lg shadow-orange-500/20"
          >
            <span class="material-symbols-outlined text-sm" style="font-variation-settings: 'FILL' 1;">person_add</span>
            Nueva Cuenta
          </button>
        </div>
        
        <div class="card-cream rounded-[1.5rem] overflow-hidden shadow-xl border border-black/5">
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="bg-black/5">
                  <th class="p-4 text-xs font-bold uppercase tracking-wider text-[#525155]">Usuario</th>
                  <th class="p-4 text-xs font-bold uppercase tracking-wider text-[#525155]">Rol</th>
                  <th class="p-4 text-xs font-bold uppercase tracking-wider text-[#525155]">Estado</th>
                  <th class="p-4 text-xs font-bold uppercase tracking-wider text-[#525155] text-right">Acciones</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-black/5">
                <!-- Loading skeleton -->
                <tr v-if="usersLoading">
                  <td colspan="4" class="p-8 text-center">
                    <span class="material-symbols-outlined text-[#adaaad] animate-spin">progress_activity</span>
                  </td>
                </tr>
                <!-- Empty state -->
                <tr v-else-if="users.length === 0">
                  <td colspan="4" class="p-8 text-center text-[#adaaad] text-sm">No hay cuentas registradas.</td>
                </tr>
                <!-- User rows -->
                <tr v-else v-for="user in users" :key="user.id" class="hover:bg-white/40 transition-colors">
                  <td class="p-4">
                    <p class="font-bold text-[#0e0e10] brand">{{ user.name }}</p>
                    <p class="text-xs text-[#adaaad]">{{ user.email }}</p>
                  </td>
                  <td class="p-4">
                    <span class="px-2 py-1 bg-black/5 rounded text-xs font-bold uppercase text-[#3f3f42] border border-black/10">
                      {{ user.role }}
                    </span>
                  </td>
                  <td class="p-4">
                    <span :class="['px-2 py-1 rounded-full text-xs font-bold', user.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700']">
                      {{ user.isActive ? 'Activo' : 'Inactivo' }}
                    </span>
                  </td>
                  <td class="p-4 text-right">
                    <button class="text-[#adaaad] hover:text-orange-500 transition-colors p-1">
                      <span class="material-symbols-outlined text-sm">edit</span>
                    </button>
                    <button class="text-[#adaaad] hover:text-red-500 transition-colors p-1 ml-2">
                      <span class="material-symbols-outlined text-sm">delete</span>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <!-- Monitoreo de Endpoints (1/3 width) -->
      <section class="lg:col-span-1">
         <div class="flex items-center justify-between mb-6">
          <h2 class="text-2xl font-bold tracking-tight text-white brand">Monitoreo API</h2>
          <span class="flex items-center gap-1 text-emerald-400 text-xs font-bold uppercase tracking-widest bg-emerald-400/10 px-2 py-1 rounded-full border border-emerald-400/20">
            <span class="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
            En Línea
          </span>
        </div>

        <div class="card-cream rounded-[1.5rem] p-6 shadow-xl border border-black/5 flex flex-col gap-4">
          <div v-for="(ep, idx) in endpoints" :key="idx" class="flex items-center justify-between p-3 rounded-xl bg-white border border-black/5 hover:border-black/10 transition-colors">
            <div class="flex items-center gap-3">
              <span :class="['text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded', getMethodColor(ep.method)]">
                {{ ep.method }}
              </span>
              <span class="text-sm font-semibold text-[#3f3f42] font-mono tracking-tight">{{ ep.path }}</span>
            </div>
            <div class="flex flex-col items-end">
              <span class="text-xs font-bold text-emerald-600">{{ ep.status }}</span>
              <span class="text-[10px] text-[#adaaad]">{{ ep.latency }}</span>
            </div>
          </div>
          
          <button class="w-full mt-2 py-3 rounded-xl border border-dashed border-orange-500/40 text-orange-500 text-xs font-bold uppercase hover:bg-orange-500/5 transition-colors">
            Ver Logs Completos
          </button>
        </div>
      </section>

    </div>
  </div>

  <!-- Create User Modal -->
  <CreateUserModal
    v-if="showCreateModal"
    @close="showCreateModal = false"
    @created="onUserCreated"
  />
</template>

<style scoped>
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
</style>
