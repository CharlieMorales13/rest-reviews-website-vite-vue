import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { useAuthStore } from '@/entities/user/model/authStore';
import App from './App.vue';
import { router } from './router';
import '@/shared/assets/css/main.css';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);

// Verify token (and silently refresh if needed) before router guards run
const authStore = useAuthStore();
await authStore.initAuth();

app.mount('#app');
