import Vue from 'vue'
import Router from 'vue-router'
import Auth from '@okta/okta-vue'
import authn from '@/plugins/authn'
import Home from '@/views/Home.vue'
import Activate from '@/components/Activate'
import LoginComponent from '@/components/Login'
import Tenants from "@/components/Tenants";
// import AppMaster from "@/components/AppMaster";
// import Applications from "@/components/Applications";
import Users from "@/components/Users";
import Tokens from "@/components/Tokens";
import Settings from "@/components/Settings";
import TenantApps from "@/components/TenantApps";
import config from '@/.config.js'

Vue.use(Router)

const router = new Router({
    mode: 'history',
    base: process.env.BASE_URL,
    routes: [{
            path: '/',
            name: 'home',
            component: Home,
            meta: {
                title: "Home",
                requiresAuth: true
            }
        },
        {
            path: '/activate/:token',
            name: 'activate',
            component: Activate,
            meta: {
                title: "Activate"
            }
        },
        {
            path: '/login',
            component: LoginComponent,
            meta: {
                title: "Sign In"
            }
        },
        {
            path: '/oauth/callback',
            component: Auth.handleCallback()
        },
        {
            path: "/tokens",
            name: "tokens",
            component: Tokens,
            meta: {
                title: "Tokens",
                requiresAuth: true
            }
        },        
        {
            path: '/users',
            name: 'users',
            component: Users,
            meta: {
                title: "Users",
                requiresAuth: true
            }
        },
        {
            path: '/settings',
            name: 'settings',
            component: Settings,
            meta: {
                title: "Settings",
                requiresAuth: true
            }
        },
        {
            path: '/apps',
            name: 'tenantApps',
            component: TenantApps,
            meta: {
                title: "TenantApps",
                requiresAuth: true
            }
        },        
        {
            path: '/tenants',
            name: 'tenants',
            component: Tenants,
            meta: {
                title: "Tenants",
                requiresAuth: true
            }
        },      
    ]
})

config.oidc.redirect_uri = window.location.protocol + '//' + window.location.host + config.oidc.redirect_uri

Vue.use(Auth, {
    issuer: config.oidc.issuer,
    client_id: config.oidc.client_id,
    redirect_uri: config.oidc.redirect_uri,
    scopes: config.oidc.scope.split(' '),
    pkce: true,
    onSessionExpired: function() {
        window.location.href = '/login';
    }
})

Vue.use(authn, Vue.prototype.$auth);



const onAuthRequired = async (from, to, next) => {
    document.title = config.brand.name;
    if (from.matched.some(record => record.meta.requiresAuth) && !(await Vue.prototype.$auth.isAuthenticated())) {
        document.title = config.brand.name + " - " + "Sign In";
        if (config.loginRedirect) {
            Vue.prototype.$auth.loginRedirect('/')
        } else {
            next({
                path: '/login'
            })
        }
    } else {
        document.title = config.brand.name + " - " + from.meta.title;
        next()
    }
}

router.beforeEach(onAuthRequired)

export default router