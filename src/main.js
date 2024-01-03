import './assets/css/app.css'
import 'primevue/resources/themes/lara-light-indigo/theme.css'
import 'primevue/resources/primevue.min.css'
import 'primeicons/primeicons.css'

import { createApp } from 'vue';
import App from './App.vue'
import PrimeVue from 'primevue/config';
import AutoComplete from 'primevue/autocomplete';

import { ref } from "vue";

const app = createApp(App);
app.use(PrimeVue);

app.component('AutoComplete', AutoComplete);

app.mount('#app');
