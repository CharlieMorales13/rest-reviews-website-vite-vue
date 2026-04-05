<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { httpClient } from '@/shared/api/httpClient';
import { AdminService, type AdminUser, type PaginationMeta } from '@/entities/user/api/AdminService';
import CreateUserModal from './CreateUserModal.vue';
import EditUserModal from './EditUserModal.vue';

// ── ML Pipeline ──────────────────────────────────────────
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

// ── System Metrics ────────────────────────────────────────
const systemMetrics = ref([
  { id: '1', title: 'Cuentas Totales', value: '—', icon: 'group', color: 'orange-500' },
  { id: '2', title: 'Establecimientos Activos', value: '4', icon: 'storefront', color: 'blue-500' },
  { id: '3', title: 'Reseñas Procesadas', value: '—', icon: 'reviews', color: 'emerald-500' },
  { id: '4', title: 'Salud de Endpoints API', value: '100%', icon: 'monitor_heart', color: 'purple-500' },
]);

// ── Users + Pagination ────────────────────────────────────
const users = ref<AdminUser[]>([]);
const pagination = ref<PaginationMeta>({ total: 0, page: 1, limit: 10, totalPages: 1 });
const usersLoading = ref(true);
const currentPage = ref(1);

const loadUsers = async (page = currentPage.value) => {
  usersLoading.value = true;
  try {
    const result = await AdminService.listUsers(page, 10);
    users.value = result.data;
    pagination.value = result.meta;
    currentPage.value = page;
    systemMetrics.value[0].value = result.meta.total.toString();
  } catch {
    // keep empty
  } finally {
    usersLoading.value = false;
  }
};

onMounted(() => loadUsers(1));

const goToPage = (p: number) => {
  if (p < 1 || p > pagination.value.totalPages) return;
  loadUsers(p);
};

// ── Create Modal ──────────────────────────────────────────
const showCreateModal = ref(false);
const onUserCreated = () => loadUsers(1);

// ── Edit Modal ────────────────────────────────────────────
const editTarget = ref<AdminUser | null>(null);
const onUserUpdated = (updated: AdminUser) => {
  const idx = users.value.findIndex(u => u.id === updated.id);
  if (idx !== -1) users.value[idx] = updated;
  editTarget.value = null;
};

// ── Delete ────────────────────────────────────────────────
const deleteTarget = ref<AdminUser | null>(null);
const deleteLoading = ref(false);
const confirmDelete = async () => {
  if (!deleteTarget.value || deleteLoading.value) return;
  deleteLoading.value = true;
  try {
    await AdminService.deleteUser(deleteTarget.value.id);
    deleteTarget.value = null;
    await loadUsers(currentPage.value);
  } catch {
    // silently fail
  } finally {
    deleteLoading.value = false;
  }
};

const roleLabel: Record<string, string> = { student: 'Estudiante', manager: 'Gerente', admin: 'Admin' };

// ── API Request Logs ──────────────────────────────────────
interface RequestLog {
  method: string;
  path: string;
  statusCode: number;
  responseTimeMs: number;
  timestamp: string;
}
const requestLogs = ref<RequestLog[]>([]);
const logsLoading = ref(false);
const logsError = ref(false);

const loadLogs = async () => {
  logsLoading.value = true;
  logsError.value = false;
  try {
    const res = await httpClient.get<{ success: boolean; data: RequestLog[] }>('/api/metrics/request-logs');
    requestLogs.value = res.data.data;
  } catch {
    logsError.value = true;
  } finally {
    logsLoading.value = false;
  }
};

onMounted(() => loadLogs());

const getMethodColor = (method: string) => {
  switch (method) {
    case 'GET': return 'text-emerald-600 bg-emerald-50';
    case 'POST': return 'text-blue-600 bg-blue-50';
    case 'PUT':
    case 'PATCH': return 'text-amber-600 bg-amber-50';
    case 'DELETE': return 'text-red-600 bg-red-50';
    default: return 'text-gray-600 bg-gray-50';
  }
};

const getStatusColor = (code: number) => {
  if (code < 300) return 'text-emerald-600';
  if (code < 400) return 'text-blue-500';
  if (code < 500) return 'text-amber-500';
  return 'text-red-500';
};

const formatTime = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
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
        Control total del sistema: gestión de cuentas, auditoría de establecimientos y monitoreo en tiempo real del backend.
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
          <div :class="`absolute -top-10 -right-10 w-24 h-24 bg-${metric.color}/10 rounded-full blur-2xl group-hover:bg-${metric.color}/20 transition-colors`"></div>
          <div :class="`w-12 h-12 rounded-xl bg-white border border-black/5 text-${metric.color} flex items-center justify-center shadow-sm z-10`">
            <span class="material-symbols-outlined text-2xl" style="font-variation-settings: 'FILL' 1;">{{ metric.icon }}</span>
          </div>
          <div class="z-10">
            <h3 class="text-[#525155] text-xs font-bold mb-1 uppercase tracking-widest">{{ metric.title }}</h3>
            <span class="text-3xl font-black text-[#0e0e10] brand leading-none">{{ metric.value }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- ML Pipeline -->
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
              : 'bg-orange-500 hover:bg-orange-400 text-white shadow-lg shadow-orange-500/25'"
          >
            <span class="material-symbols-outlined text-xl" :class="pipelineRunning ? 'animate-spin' : ''" style="font-variation-settings: 'FILL' 1;">
              {{ pipelineRunning ? 'progress_activity' : 'play_circle' }}
            </span>
            {{ pipelineRunning ? 'Procesando...' : 'Ejecutar Pipeline' }}
          </button>
        </div>
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

    <!-- Users + API Logs side by side -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">

      <!-- Users Table (2/3) -->
      <section class="lg:col-span-2">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h2 class="text-2xl font-bold tracking-tight text-white brand">Directorio de Cuentas</h2>
            <p v-if="!usersLoading" class="text-[#adaaad] text-xs mt-0.5">
              {{ pagination.total }} cuenta{{ pagination.total !== 1 ? 's' : '' }} · página {{ pagination.page }} de {{ pagination.totalPages }}
            </p>
          </div>
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
                <tr v-if="usersLoading">
                  <td colspan="4" class="p-8 text-center">
                    <span class="material-symbols-outlined text-[#adaaad] animate-spin">progress_activity</span>
                  </td>
                </tr>
                <tr v-else-if="users.length === 0">
                  <td colspan="4" class="p-8 text-center text-[#adaaad] text-sm">No hay cuentas registradas.</td>
                </tr>
                <tr v-else v-for="user in users" :key="user.id" class="hover:bg-white/40 transition-colors">
                  <td class="p-4">
                    <p class="font-bold text-[#0e0e10] brand">{{ user.name }}</p>
                    <p class="text-xs text-[#adaaad]">{{ user.email }}</p>
                    <p v-if="user.establishment" class="text-[10px] text-orange-500 font-semibold mt-0.5">
                      <span class="material-symbols-outlined text-[10px]" style="font-size: 11px; vertical-align: middle;">storefront</span>
                      {{ user.establishment.name }}
                    </p>
                  </td>
                  <td class="p-4">
                    <span class="px-2 py-1 bg-black/5 rounded text-xs font-bold uppercase text-[#3f3f42] border border-black/10">
                      {{ roleLabel[user.role] ?? user.role }}
                    </span>
                  </td>
                  <td class="p-4">
                    <span :class="['px-2 py-1 rounded-full text-xs font-bold', user.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700']">
                      {{ user.isActive ? 'Activo' : 'Inactivo' }}
                    </span>
                  </td>
                  <td class="p-4 text-right">
                    <button @click="editTarget = user" class="text-[#adaaad] hover:text-orange-500 transition-colors p-1" title="Editar">
                      <span class="material-symbols-outlined text-sm">edit</span>
                    </button>
                    <button @click="deleteTarget = user" class="text-[#adaaad] hover:text-red-500 transition-colors p-1 ml-2" title="Eliminar">
                      <span class="material-symbols-outlined text-sm">delete</span>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          <div v-if="pagination.totalPages > 1" class="flex items-center justify-between px-4 py-3 border-t border-black/5 bg-black/[0.02]">
            <button
              @click="goToPage(currentPage - 1)"
              :disabled="currentPage <= 1"
              class="flex items-center gap-1 text-xs font-bold text-[#525155] disabled:opacity-30 hover:text-[#0e0e10] transition-colors px-3 py-2 rounded-lg hover:bg-black/5"
            >
              <span class="material-symbols-outlined text-sm">chevron_left</span>
              Anterior
            </button>

            <div class="flex items-center gap-1">
              <button
                v-for="p in pagination.totalPages"
                :key="p"
                @click="goToPage(p)"
                :class="[
                  'w-8 h-8 rounded-lg text-xs font-bold transition-colors',
                  p === currentPage
                    ? 'bg-orange-500 text-white'
                    : 'text-[#525155] hover:bg-black/5 hover:text-[#0e0e10]'
                ]"
              >
                {{ p }}
              </button>
            </div>

            <button
              @click="goToPage(currentPage + 1)"
              :disabled="currentPage >= pagination.totalPages"
              class="flex items-center gap-1 text-xs font-bold text-[#525155] disabled:opacity-30 hover:text-[#0e0e10] transition-colors px-3 py-2 rounded-lg hover:bg-black/5"
            >
              Siguiente
              <span class="material-symbols-outlined text-sm">chevron_right</span>
            </button>
          </div>
        </div>
      </section>

      <!-- API Request Logs (1/3) -->
      <section class="lg:col-span-1">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-2xl font-bold tracking-tight text-white brand">Logs de API</h2>
          <div class="flex items-center gap-2">
            <span class="flex items-center gap-1 text-emerald-400 text-xs font-bold uppercase tracking-widest bg-emerald-400/10 px-2 py-1 rounded-full border border-emerald-400/20">
              <span class="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
              En Línea
            </span>
            <button
              @click="loadLogs"
              :disabled="logsLoading"
              class="p-1.5 rounded-lg text-[#adaaad] hover:text-white hover:bg-white/5 transition-colors"
              title="Actualizar"
            >
              <span class="material-symbols-outlined text-sm" :class="logsLoading ? 'animate-spin' : ''">refresh</span>
            </button>
          </div>
        </div>

        <div class="card-cream rounded-[1.5rem] p-4 shadow-xl border border-black/5 flex flex-col gap-2 max-h-[520px] overflow-y-auto">
          <!-- Loading -->
          <div v-if="logsLoading" class="py-8 text-center">
            <span class="material-symbols-outlined text-[#adaaad] animate-spin">progress_activity</span>
          </div>

          <!-- Error -->
          <div v-else-if="logsError" class="py-6 text-center text-xs text-red-400">
            Error al cargar logs. Intenta de nuevo.
          </div>

          <!-- Empty -->
          <div v-else-if="requestLogs.length === 0" class="py-8 text-center text-xs text-[#adaaad]">
            Sin actividad reciente.
          </div>

          <!-- Log rows -->
          <div
            v-else
            v-for="(log, idx) in requestLogs"
            :key="idx"
            class="flex items-center justify-between p-3 rounded-xl bg-white border border-black/5 hover:border-black/10 transition-colors gap-2"
          >
            <div class="flex items-center gap-2 min-w-0">
              <span :class="['text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded flex-shrink-0', getMethodColor(log.method)]">
                {{ log.method }}
              </span>
              <span class="text-xs font-semibold text-[#3f3f42] font-mono truncate">{{ log.path }}</span>
            </div>
            <div class="flex flex-col items-end flex-shrink-0 text-right">
              <span :class="['text-xs font-bold', getStatusColor(log.statusCode)]">{{ log.statusCode }}</span>
              <span class="text-[9px] text-[#adaaad]">{{ log.responseTimeMs }}ms</span>
              <span class="text-[9px] text-[#adaaad]">{{ formatTime(log.timestamp) }}</span>
            </div>
          </div>
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

  <!-- Edit User Modal -->
  <EditUserModal
    v-if="editTarget"
    :user="editTarget"
    @close="editTarget = null"
    @updated="onUserUpdated"
  />

  <!-- Delete Confirm Modal -->
  <Teleport to="body">
    <div v-if="deleteTarget" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="deleteTarget = null" />
      <div class="relative w-full max-w-sm bg-[#1a1a1d] rounded-3xl border border-white/10 shadow-2xl p-8 flex flex-col items-center text-center gap-5">
        <div class="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
          <span class="material-symbols-outlined text-red-400 text-3xl" style="font-variation-settings: 'FILL' 1;">delete_forever</span>
        </div>
        <div>
          <h3 class="text-xl font-black text-white brand">¿Eliminar cuenta?</h3>
          <p class="text-[#adaaad] text-sm mt-1">
            Se eliminará permanentemente la cuenta de
            <span class="text-white font-bold">{{ deleteTarget.name }}</span>.
            Esta acción no se puede deshacer.
          </p>
        </div>
        <div class="flex gap-3 w-full">
          <button
            @click="deleteTarget = null"
            class="flex-1 py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-[#adaaad] font-bold text-sm transition-colors"
          >
            Cancelar
          </button>
          <button
            @click="confirmDelete"
            :disabled="deleteLoading"
            class="flex-1 py-3 rounded-2xl bg-red-500 hover:bg-red-400 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <span v-if="deleteLoading" class="material-symbols-outlined text-sm animate-spin">progress_activity</span>
            {{ deleteLoading ? 'Eliminando...' : 'Eliminar' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
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
