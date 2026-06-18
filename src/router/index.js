import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import ReglementView from '../views/ReglementView.vue'
import GameView from '../views/GameView.vue'
import FormulaireView from '../views/FormulaireView.vue'
import BoutiqueView from '../views/BoutiqueView.vue'
import ProductView from '../views/ProductView.vue'
import CartView from '../views/CartView.vue'
import CheckoutSuccessView from '../views/CheckoutSuccessView.vue'

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
    },
    {
      path: '/boutique',
      name: 'boutique',
      component: BoutiqueView
    },
    {
      path: '/boutique/:id',
      name: 'product',
      component: ProductView
    },
    {
      path: '/panier',
      name: 'cart',
      component: CartView
    },
    {
      path: '/commande/merci',
      name: 'checkout-success',
      component: CheckoutSuccessView
    }
  ]
})

export default router