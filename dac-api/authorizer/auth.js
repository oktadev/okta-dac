"use strict";
const AuthPolicy = require('aws-auth-policy');
const OktaJwtVerifier = require('@okta/jwt-verifier');

const oktaJwtVerifier = new OktaJwtVerifier({
    issuer: process.env.ISSUER,
});

const requiresAccessToken = ['idps', 'tenants', 'admins', 'apps'];

module.exports.handler = (event, context) => {
    console.log("using authroizer")
    const arnParts = event.methodArn.split(':');
    const apiGatewayArnPart = arnParts[5].split('/');
    const awsAccountId = arnParts[4];
    const apiOptions = {
        region: arnParts[3],
        restApiId: apiGatewayArnPart[0],
        stage: apiGatewayArnPart[1]
    };
    
    const proxyPath = arnParts[5].split('/')[3];
    // passthrough the o4o token:
    if (requiresAccessToken.findIndex(resource => { return proxyPath === resource }) < 0) {
        const policy = new AuthPolicy("access_token_passthrough", awsAccountId, apiOptions);
        policy.allowMethod(AuthPolicy.HttpVerb.ALL, "/*");        
        return context.succeed(policy.build());
    }

    const accessTokenString = event.authorizationToken.split(' ')[1];

    oktaJwtVerifier.verifyAccessToken(accessTokenString, process.env.AUD)
    .then((jwt) => {
        const policy = new AuthPolicy(jwt.claims.sub, awsAccountId, apiOptions);
        

        // Everyone can read apps
        policy.allowMethod(AuthPolicy.HttpVerb.GET, "apps");
        policy.allowMethod(AuthPolicy.HttpVerb.GET, "apps/*");

        const tenants = jwt.claims.tenants;
        if (tenants && tenants.length > 0) {
            policy.allowMethod(AuthPolicy.HttpVerb.GET, 'idps');
            tenants.forEach((tenant)=>{
                const parts = tenant.split(':');

                // Tenant Admins can read/manage their own idp settings
                policy.allowMethod(AuthPolicy.HttpVerb.GET, 'idps/' + parts[0]);
                policy.allowMethod(AuthPolicy.HttpVerb.GET, 'idps/' + parts[0] + '/metadata.xml');
                policy.allowMethod(AuthPolicy.HttpVerb.PUT, 'idps/' + parts[0]);

                // Tenant Admins can assign all tenant users to app
                policy.allowMethod(AuthPolicy.HttpVerb.GET, 'tenants/' + parts[1]);
                policy.allowMethod(AuthPolicy.HttpVerb.PUT, 'tenants/' + parts[1] + '/apps/*');
            });            
        }
        if (jwt.claims.groups && jwt.claims.groups.includes('SUPERUSERS')) {
            // Only superusers can read/add tenants
            policy.allowMethod(AuthPolicy.HttpVerb.GET, "tenants");
            policy.allowMethod(AuthPolicy.HttpVerb.POST, "tenants");
            policy.allowMethod(AuthPolicy.HttpVerb.ALL, "tenants/*");

            // read admins
            policy.allowMethod(AuthPolicy.HttpVerb.GET, "org/*");

            // update app profile
            policy.allowMethod(AuthPolicy.HttpVerb.PUT, "apps/*");
        } else {
            jwt.claims.groups.forEach(grp=>{
                if (grp.startsWith('ADMINS_')) {
                    policy.allowMethod(AuthPolicy.HttpVerb.GET, "tenants/" + grp.split('_')[1]);
                    policy.allowMethod(AuthPolicy.HttpVerb.PUT, "tenants/" + grp.split('_')[1] + "/admins/*");
                    policy.allowMethod(AuthPolicy.HttpVerb.GET, "tenants/" + grp.split('_')[1] + "/domains");
                    policy.allowMethod(AuthPolicy.HttpVerb.GET, "tenants/" + grp.split('_')[1] + "/domains/*");
                    policy.allowMethod(AuthPolicy.HttpVerb.POST, "tenants/" + grp.split('_')[1] + "/domains");
                    policy.allowMethod(AuthPolicy.HttpVerb.PUT, "tenants/" + grp.split('_')[1] + "/domains/*");
                    policy.allowMethod(AuthPolicy.HttpVerb.DELETE, "tenants/" + grp.split('_')[1] + "/domains/*");
                }
            });
        }

        let builtPolicy = policy.build();
        builtPolicy.context = {
            sub: jwt.claims.sub,
            tenants: JSON.stringify(tenants),
            groups: JSON.stringify(jwt.claims.groups)
        }
        console.log(builtPolicy.policyDocument.Statement);
        return context.succeed(builtPolicy);
    })
    .catch((err) => {
        console.log(err);
        return context.fail('Unauthorized');
    });
};
