import { createApp } from 'vue'
import App from './App.vue'
import router from './router' // On importe le routeur
import i18n from './i18n'

const app = createApp(App)

app.use(router) // On dit à Vue d'utiliser le routeur
app.use(i18n)
app.mount('#app')