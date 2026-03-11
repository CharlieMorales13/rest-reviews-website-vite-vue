import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../../application/stores/useAuthStore';

const routes = [
  {
    path: '/',
    redirect: '/login',
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('../views/auth/LoginView.vue'),
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('../views/auth/RegisterView.vue'),
  },
  {
    path: '/',
    component: () => import('../layouts/AppLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        redirect: '/dashboard'
      },
      {
        path: 'dashboard',
        name: 'dashboard',
        component: () => import('../views/dashboard/DashboardView.vue'),
        meta: { roles: ['manager', 'admin', 'student'] }
      },
      {
        path: 'establishments',
        name: 'establishments',
        component: () => import('../views/reviews/EstablishmentsView.vue')
      },
      {
        path: 'review/create/:id',
        name: 'create-review',
        component: () => import('../views/reviews/CreateReviewView.vue'),
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

router.beforeEach((to, from, next) => {
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
