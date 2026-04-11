import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import '@jauto/ui/styles/variables.css';
import '@jauto/ui/styles/base.css';

const app = createApp(App);
app.use(createPinia());
app.mount('#app');
