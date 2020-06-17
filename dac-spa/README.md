## Project setup

```sh
npm install
```

## Manual Setup
**If you prefer not to use the makefile, then follow these steps:**

### Config File
1. `cd` into `/dac-spa`, then:
2. Run `npm install`
3. Create env file `.env.development.local` (In that same `/dac-spa` directory. Note: there is an existing `.env` file. Do not touch that file; Add this `.local` in addition to it). Edit it in with the values below:
    ```
    VUE_APP_CLIENT_ID=<<client id here>>
    VUE_APP_ISSUER=<<issuer uri here>>
    VUE_APP_ENFORCE_DOMAIN_CHECK=true
    VUE_APP_API=<<rest api endpoint>
    ```
    Where the above variables are:
   | Variable                     | Where to find |
   | ---------------------------- |:------------- |
   | VUE_APP_CLIENT_ID            | The `client_id` of the Okta App. In Okta, search for the app named `okta-dac` (that was provisioned by terraform) |
   | VUE_APP_ISSUER               | The `issuer_uri` of the Auth Server. In Okta, search for the Authorization Server named `okta-dac` (that was provisioned by terraform) |
   | VUE_APP_API                  | The api base url of the API that was deployed |
   | VUE_APP_ENFORCE_DOMAIN_CHECK | DAC enforces that Tenant Admins add users with emails that match only verified domains. However, this may be difficult if you want to test with usernames having `@mailinator.com` (for example). Simply set to `false` and DAC will stop validating domains. |

4. The following command compiles and hot-reloads for development environment
   ```
   npm run serve
   ```
5. Open your browser to `http://localhost:8080` and login

---

# Options

## Webfinger and Domain Verification Plugin

This project uses Okta routing rules (idp discovery) by default. Due to known scaling limitations, it is advisable to not use the okta idp discovery functionality if expecting 1000s of inbound IdPs. If you anticipate a large number of inbound federation with idp-discovery, then: 
* Deploy the [okta-dac-domains-serverless](https://github.com/udplabs/okta-dac-domains-serverless) microservice instead.
* Add the following setting in the `.env` file:

```sh
VUE_APP_USE_WEBFINGER_PLUGIN=true
VUE_APP_WEBFINGER_PLUGIN=<<url of the microservice>>
```

This setting will use the microservice for storing domains, unverified domains (for domain verification) and idp-discovery functionality.

## Stylesheet options

Add a file `.env.local` (in the root directory) with these contents:

**Values below are for example purposes**

```sh
# Styling Information
VUE_APP_LOGO=https://cdn.freelogovectors.net/wp-content/uploads/2018/05/workday-logo-icon.png
VUE_APP_MAINCOLOR=#ffa126
VUE_APP_COMPANY_NAME=Workday
```

