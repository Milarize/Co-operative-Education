import { createApp } from 'vue';
import App from './App.vue';
import { createPinia } from 'pinia';
import router from './router';
import 'animate.css'
// เพิ่ม import สำหรับ Vuetify
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import '@mdi/font/css/materialdesignicons.css'

// localStorage.removeItem('token')
// localStorage.clear()

console.log('localStorage.getItem(user)', localStorage.getItem('user'))
console.log('localStorage.getItem(token)', localStorage.getItem('token'))
const vuetify = createVuetify({
  components,
  directives,
})

const app = createApp(App);
app.use(createPinia());
app.use(router);
app.use(vuetify); // เพิ่ม Vuetify
app.mount("#app");