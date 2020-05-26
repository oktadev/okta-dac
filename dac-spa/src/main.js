import Vue from 'vue'
import App from './App.vue'
import vuetify from '@/plugins/vuetify'
import utils from '@/plugins/utils'
import i18n from "@/plugins/i18n"
import router from '@/router'
import store from '@/store'
import config from "@/.config.js"

Vue.config.productionTip = false

Vue.use(utils);
Vue.prototype.$config = config;

new Vue({
  vuetify,
  router,
  store,
  utils,
  i18n,
  render: h => h(App)
}).$mount("#app");
