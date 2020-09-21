import Vue from 'vue';
import Vuex from 'vuex';
import VuexPersistence from 'vuex-persist';

Vue.use(Vuex);

const vuexLocal = new VuexPersistence({
    key: 'okta-mta',
    storage: window.localStorage
})

const store = new Vuex.Store({
    state: {
        o4oToken: "",
        activeTenant: "",
        verifiedDomains: [],
        tenants: [],
    },
    getters: {
        o4oToken: state => {
            // To-Do: Clean up this mess.
            // Apparently vuex doesnt play well with vue-router in history mode.
            // if (!state.o4oToken) {
            //     let oktaMta = localStorage.getItem('okta-mta');
            //     if (oktaMta) {
            //         // This is a really *sad* workaround.
            //         console.log("Vuex: gettters.o4oToken. Returning localStorage", oktaMta);
            //         return JSON.parse(oktaMta).o4oToken
            //     } else {
            //         console.log("Vuex: getters.o4oToken. Return empty token")
            //         return "";
            //     }
            // }
            return state.o4oToken;
        },
        activeTenant: state => {
            return state.activeTenant;
        },
        o4oJWT: state => {
            return JSON.parse(atob(state.o4oToken.split(".")[1]));
        },
        verifiedDomains: state => {
            return state.verifiedDomains;
        },
        tenants: (state) => {
          return state.tenants;
        }
    },
    mutations: {
        RESTORE_MUTATION: vuexLocal.RESTORE_MUTATION,
        setO4oToken: (state, payload) => {
            state.o4oToken = payload;
        },
        logout: (state, payload) => {
            state.o4oToken = "";
            state.verifiedDomains = "";
        },
        setActiveTenant: (state, payload) => {
            console.log("vuex: mutations.setActiveTenant", payload);
            state.activeTenant = payload;
        },
        setVerifiedDomains: (state, payload) => {
            if (!state.verifiedDomains) state.verifiedDomains = [payload];
            const index = state.verifiedDomains.findIndex(tenant=>{
                return tenant.id === payload.id;
            });
            if (index >= 0) state.verifiedDomains[index] = payload;
            else state.verifiedDomains.push(payload);
        },
        setTenants: (state, payload) => {
          state.tenants = payload;
        },
    },
    actions: {
        setO4oToken: ({commit}, payload) => {
            commit('setO4oToken', payload);
            // Renew token somewhere here
        },
        renewToken: ({commit}, payload) => {
            setTimeout(() => {
                commit('setO4oToken', payload)
            }, 1000);
        },
        setVerifiedDomains: ({commit}, payload) => {
            commit('setVerifiedDomains', payload)
        }
    },
    plugins: [vuexLocal.plugin]
});

export default store;