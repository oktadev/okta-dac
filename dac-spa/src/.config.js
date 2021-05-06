const tinycolor = require('tinycolor2');

export default {
    org: process.env.VUE_APP_ISSUER.split("/oauth2")[0],
    oidc: {
        client_id: process.env.VUE_APP_CLIENT_ID,
        issuer: process.env.VUE_APP_ISSUER,
        redirect_uri: process.env.VUE_APP_REDIRECT_URI,
        scope: process.env.VUE_APP_SCOPES
    },
    api: process.env.VUE_APP_API,
    apiWebfinger: process.env.VUE_APP_WEBFINGER_PLUGIN,
    useWebfingerPlugin: process.env.VUE_APP_USE_WEBFINGER_PLUGIN
        ? process.env.VUE_APP_USE_WEBFINGER_PLUGIN === 'true' : false,
    dnsVerificationPrefix: process.env.VUE_APP_DNS_VERIFICATION_PREFIX,
    enforceDomainCheck: process.env.VUE_APP_ENFORCE_DOMAIN_CHECK,
    brand: {
        logo: process.env.VUE_APP_LOGO,
        logo_inv: process.env.VUE_APP_LOGO_INVERSE,
        isDark: process.env.VUE_APP_PRIMARY_COLOR ? tinycolor(process.env.VUE_APP_PRIMARY_COLOR).isDark() : false,
        colorAlt: process.env.VUE_APP_PRIMARY_COLOR 
            ? tinycolor(process.env.VUE_APP_PRIMARY_COLOR).isDark() 
                ? tinycolor(process.env.VUE_APP_PRIMARY_COLOR).lighten(30).toString()
                : tinycolor(process.env.VUE_APP_PRIMARY_COLOR).darken(30).toString()
            : "primary",
        name: process.env.VUE_APP_COMPANY_NAME,
        recaptcha_key: process.env.VUE_APP_RECAPTCHA_SITE_KEY
    }
};