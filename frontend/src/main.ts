import { createApp } from 'vue'
import { createHead } from '@vueuse/head'
import router from '@/app/router.js'
import '@/app/style.css'
import App from '@/app/App.vue'

const app = createApp(App)
app.use(createHead())
app.use(router)
app.mount('#app')
