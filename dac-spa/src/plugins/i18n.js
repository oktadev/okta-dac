import Vue from "vue";
import VueI18n from "vue-i18n";

Vue.use(VueI18n);

const messages = {
  en: {
    apps: "Apps",
    home: "Home",
    tenant: "Tenant",
    tenants: "Tenants",
    users: "Users",
    settings: "Settings"
  },
  es: {
    tenant: "Grupo",
    tenants: "Grupos"
  }
};

const i18n = new VueI18n({
  locale: "en", // set locale
  fallbackLocale: "es", // set fallback locale
  messages // set locale messages
});

export default i18n;
