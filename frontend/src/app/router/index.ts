import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/entities/user/model/authStore';

const routes = [
  {
    path: '/',
    redirect: '/login',
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/pages/login/ui/LoginPage.vue'),
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('@/pages/register/ui/RegisterPage.vue'),
    meta: { guest: true },
  },
  {
    path: '/',
    component: () => import('@/widgets/Layout/ui/AppLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        redirect: '/dashboard'
      },
      {
        path: 'dashboard',
        name: 'dashboard',
        component: () => import('@/pages/dashboard/ui/DashboardPage.vue'),
        meta: { roles: ['manager', 'admin', 'student'] }
      },
      {
        path: 'establishments',
        name: 'establishments',
        component: () => import('@/pages/establishments/ui/EstablishmentsPage.vue')
      },
      {
        path: 'review/create/:id',
        name: 'create-review',
        component: () => import('@/pages/create-review/ui/CreateReviewPage.vue'),
        meta: { roles: ['student'] },
        props: true
      }
    ]
  }
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, _from, next) => {
  const authStore = useAuthStore();
  const requiresAuth = to.meta.requiresAuth;
  const allowedRoles = to.meta.roles as string[] | undefined;

  if (requiresAuth && !authStore.isAuthenticated) {
    next('/login');
  } else if (requiresAuth && allowedRoles && authStore.userRole && !allowedRoles.includes(authStore.userRole)) {
    // Role not authorized
    next('/dashboard');
  } else {
    next();
  }
});
