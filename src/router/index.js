import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import voteEntrance from '../views/voteEntrance.vue'
import mainFrame from '../views/mainFrame.vue'

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: mainFrame,
      redirect: '/join',
      children: [
        {
          path: '/join',
          name: 'join',
          component: () => import('../views/voteEntrance.vue')
        },
        {
          path: '/login',
          name: 'login',
          component: () => import('../views/authentication.vue')
        },
        {
          path: '/dashboard',
          name: 'dashboard',
          component: () => import('../views/userDashboard.vue'),
          children: [
            {
              path: '/create',
              name: 'create',
              component: () => import('../components/voteCreate.vue')
            },
            {
              path: '/manage',
              name: 'manage',
              component: () => import('../components/manageVote.vue')
            }
          ]
        },
        {
          path: '/vote',
          name: 'vote',
          component: () => import('../views/voteView.vue')
        }
      ]
    },

    // {
    //   path: '/login',
    //   name: 'login',
    //   component: () => import('../views/authentication.vue')
    // },
    // {
    //   path: '/about',
    //   name: 'about',
    //   // route level code-splitting
    //   // this generates a separate chunk (About.[hash].js) for this route
    //   // which is lazy-loaded when the route is visited.
    //   component: () => import('../views/AboutView.vue'),
    // },
  ],
})

export default router
