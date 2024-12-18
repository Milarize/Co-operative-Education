import { createRouter, createWebHistory } from 'vue-router';
import RegisterAdmin from '../components/RegisterAdmin.vue';
const Login = () => import('../components/Login.vue');
const MainLayout = () => import('../App.vue');
const Home = () => import('../components/Home.vue');
const personDetection =()=> import('../components/ORC/persondetection.vue')
const signDetection =()=> import('../components/ORC/signdetection.vue')
const routes = [
  {
    path: '/',
    component: MainLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'Home',
        component: () => import('../components/Home.vue'),
        meta: { requiresAuth: true }
      }
    ]
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { requiresAuth: false }
  },
  {
    path: '/sign',
    name:'sign',
    component:signDetection,
    meta: { requiresAuth: false }
  },
  {
    path: '/OCR',
    name:'OCR',
    component:personDetection,
    meta: { requiresAuth: false }

  },

  {
    path: '/registerForAdminCDG-Beaver',
    name: 'RegisterAdmin',
    component: RegisterAdmin,
    meta: { requiresAuth: false }
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/login'
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, from, next) => {
  const isAuthenticated = localStorage.getItem('token');

  if (to.meta.requiresAuth && !isAuthenticated) {
    next('/login');
  } else if (to.path === '/login' && isAuthenticated) {
    next('/');
  } else {
    next();
  }
});

export default router;