import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import ReglementView from '../views/ReglementView.vue'
import GameView from '../views/GameView.vue'
import FormulaireView from '../views/FormulaireView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/reglement',
      name: 'reglement',
      component: ReglementView
    },
    {
      path: '/game',
      name: 'game',
      component: GameView
    },
    {
      path: '/preinscription',
      name: 'preinscription',
      component: FormulaireView
    }
  ]
})

export default router