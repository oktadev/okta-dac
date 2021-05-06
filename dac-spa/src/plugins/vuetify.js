import Vue from 'vue';
import Vuetify from 'vuetify/lib';
import tinycolor from 'tinycolor2';

Vue.use(Vuetify);

export default new Vuetify({
  theme: {
    themes: {
      light: {
        primary: process.env.VUE_APP_PRIMARY_COLOR 
          ? process.env.VUE_APP_PRIMARY_COLOR 
          : "#1976D2",
        secondary: process.env.VUE_APP_SECONDARY_COLOR 
          ? process.env.VUE_APP_SECONDARY_COLOR 
          : '#424242',
        accent: process.env.VUE_APP_PRIMARY_COLOR
          ? tinycolor(process.env.VUE_APP_PRIMARY_COLOR).brighten(30).toString()
          : '#82B1FF',
        error: '#FF5252',
        info: '#2196F3',
        success: '#4CAF50',
        warning: '#FFC107'        
      },
    },
  },  
});
