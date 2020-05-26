

class Auth {
    constructor(auth){
        this.auth = auth;
    }
    async getAccessToken() {
        try {
            const token = await this.auth.getAccessToken();
            if (token) {
                return token;
            }
        } catch (e) {
            console.log(e);
        }
        // Assert failed...logout and redirect
        this.auth.logout();
        window.location.href = '/';
    }
}

function install (Vue, auth) {
    Vue.prototype.$authn = new Auth(auth);
  }
  
export default { install }
  