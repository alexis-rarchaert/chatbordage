import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import i18n from './i18n'
import './styles/tokens.css'

const app = createApp(App)

app.use(router) // On dit à Vue d'utiliser le routeur
app.use(i18n)
app.mount('#app')