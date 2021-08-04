import { createApp } from 'vue';
import ElementPlus from 'element-plus';
import App from './App.vue';
import router from './router';
import store from './store';
import locale from 'element-plus/lib/locale/lang/zh-tw';
import 'element-plus/lib/theme-chalk/index.css';
import 'dayjs/locale/zh-tw';

const app = createApp( App );
dayjs.locale( 'tw' );
app.use( store ).use( router ).use( ElementPlus, { locale } ).mount( '#app' );
