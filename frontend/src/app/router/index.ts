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
        component: () => import('@/pages/dashboard/ui/StudentDashboard.vue'),
        meta: { roles: ['student'] }
      },
      {
        path: 'manager',
        name: 'manager-dashboard',
        component: () => import('@/pages/dashboard/ui/ManagerDashboard.vue'),
        meta: { roles: ['manager', 'admin'] }
      },
      {
        path: 'admin',
        name: 'admin-dashboard',
        component: () => import('@/pages/admin/ui/AdminDashboard.vue'),
        meta: { roles: ['admin'] }
      },
      {
        path: 'establishments',
        name: 'establishments',
        component: () => import('@/pages/establishments/ui/EstablishmentsPage.vue')
      },
      {
        path: 'establishments/:id',
        name: 'establishment-details',
        component: () => import('@/pages/establishments/ui/EstablishmentDetailsPage.vue')
      },      {
        path: 'review/create/:id',
        name: 'create-review',
        component: () => import('@/pages/create-review/ui/CreateReviewPage.vue'),
        meta: { roles: ['student'] },
        props: true
      },
      {
        path: 'profile',
        name: 'profile',
        component: () => import('@/pages/profile/ui/ProfilePage.vue')
      },
      {
        path: 'my-reviews',
        name: 'my-reviews',
        component: () => import('@/pages/profile/ui/MyReviewsPage.vue'),
        meta: { roles: ['student'] }
      }
    ]
  }
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach(async (to) => {
  const authStore = useAuthStore();

  // Check requiresAuth from matched routes (parent meta inheritance)
  const requiresAuth = to.matched.some(r => r.meta.requiresAuth);
  // Use the most-specific (deepest) route's roles list
  const allowedRoles = to.meta.roles as string[] | undefined;

  if (requiresAuth && !authStore.isAuthenticated) {
    return '/login';
  }

  if (requiresAuth && allowedRoles && authStore.userRole && !allowedRoles.includes(authStore.userRole)) {
    // Redirect to the user's home instead of a generic /dashboard
    const role = authStore.userRole;
    if (role === 'admin') return '/admin';
    if (role === 'manager') return '/manager';
    return '/dashboard';
  }

  return true;
});
