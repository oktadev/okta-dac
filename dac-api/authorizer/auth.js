"use strict";
const AuthPolicy = require('aws-auth-policy');
const OktaJwtVerifier = require('@okta/jwt-verifier');

const oktaJwtVerifier = new OktaJwtVerifier({
    issuer: process.env.ISSUER,
});

const requiresAccessToken = ['idps', 'tenants', 'admins', 'apps'];

module.exports.handler = (event, context) => {
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

    if (!event.authorizationToken) {
        return context.fail("Unauthorized");
    }
    const accessTokenString = event.authorizationToken.split(' ')[1];

    oktaJwtVerifier.verifyAccessToken(accessTokenString, process.env.AUDIENCE)
    .then((jwt) => {
        const policy = new AuthPolicy(jwt.claims.sub, awsAccountId, apiOptions);

        // Everyone can read apps
        policy.allowMethod(AuthPolicy.HttpVerb.GET, 'apps');
        policy.allowMethod(AuthPolicy.HttpVerb.GET, 'apps/*');

        const tenants = jwt.claims.tenants;
        if (tenants && tenants.length > 0) {
            policy.allowMethod(AuthPolicy.HttpVerb.GET, 'idps');
            tenants.forEach((tenant)=>{
                const parts = tenant.split(':');
                // Tenant Admins can read and update their own idp settings
                policy.allowMethod(AuthPolicy.HttpVerb.GET, 'idps/' + parts[0]);
                policy.allowMethod(AuthPolicy.HttpVerb.GET, 'idps/' + parts[0] + '/metadata.xml');
                policy.allowMethod(AuthPolicy.HttpVerb.PUT, 'idps/' + parts[0]);   

                // Read own tenants     
                policy.allowMethod(AuthPolicy.HttpVerb.GET, 'tenants/' + parts[1]);
                policy.allowMethod(AuthPolicy.HttpVerb.GET, 'tenants/' + parts[1] + '/domains');
                policy.allowMethod(AuthPolicy.HttpVerb.GET, 'tenants/' + parts[1] + '/domains/*');

                policy.allowMethod(AuthPolicy.HttpVerb.PUT, 'tenants/' + parts[1] + '/admins/*');    // Assign Tenant Admins
                policy.allowMethod(AuthPolicy.HttpVerb.POST, 'tenants/' + parts[1] + '/domains');    // Register Tenant Domains
                policy.allowMethod(AuthPolicy.HttpVerb.PUT, 'tenants/' + parts[1] + '/domains/*');   // Verify Tenant Domains
                policy.allowMethod(AuthPolicy.HttpVerb.DELETE,'tenants/' + parts[1] + '/domains/*'); // De-register Tenant Domains
                policy.allowMethod(AuthPolicy.HttpVerb.PUT, 'tenants/' + parts[1] + '/apps/*');      // Assign all tenant users to app  
                
                policy.allowMethod(AuthPolicy.HttpVerb.GET, 'tenants/' + parts[1] + '/clients');      // List Tenant Clients
                policy.allowMethod(AuthPolicy.HttpVerb.GET, 'tenants/' + parts[1] + '/clients/*');      // Get Tenant Clients Details
                policy.allowMethod(AuthPolicy.HttpVerb.POST, 'tenants/' + parts[1] + '/clients');    // Register Tenant Clients
                policy.allowMethod(AuthPolicy.HttpVerb.PUT, 'tenants/' + parts[1] + '/clients/*');    // Upddate Tenant Clients
                policy.allowMethod(AuthPolicy.HttpVerb.DELETE,'tenants/' + parts[1] + '/clients/*'); // De-register Tenant Clients
            });            
        }
        if (jwt.claims.groups && jwt.claims.groups.includes('SUPERUSERS')) {
            // Only superusers can read/add tenants
            policy.allowMethod(AuthPolicy.HttpVerb.GET, 'tenants');
            policy.allowMethod(AuthPolicy.HttpVerb.POST, 'tenants');
            policy.allowMethod(AuthPolicy.HttpVerb.ALL, 'tenants/*');
        } 
        // else {
        //     jwt.claims.groups.forEach(grp=>{
        //         if (grp.startsWith('ADMINS_')) {
        //             policy.allowMethod(AuthPolicy.HttpVerb.GET, "tenants/" + grp.split('_')[1]);
        //             policy.allowMethod(AuthPolicy.HttpVerb.PUT, "tenants/" + grp.split('_')[1] + "/admins/*");
        //             policy.allowMethod(AuthPolicy.HttpVerb.GET, "tenants/" + grp.split('_')[1] + "/domains");
        //             policy.allowMethod(AuthPolicy.HttpVerb.GET, "tenants/" + grp.split('_')[1] + "/domains/*");
        //             policy.allowMethod(AuthPolicy.HttpVerb.POST, "tenants/" + grp.split('_')[1] + "/domains");
        //             policy.allowMethod(AuthPolicy.HttpVerb.PUT, "tenants/" + grp.split('_')[1] + "/domains/*");
        //             policy.allowMethod(AuthPolicy.HttpVerb.DELETE, "tenants/" + grp.split('_')[1] + "/domains/*");
        //         }
        //     });
        // }

        let builtPolicy = policy.build();
        builtPolicy.context = {
            sub: jwt.claims.sub,
            tenants: JSON.stringify(tenants),
            groups: JSON.stringify(jwt.claims.groups)
        }

        console.log(JSON.stringify(builtPolicy));
        console.log(builtPolicy.policyDocument.Statement);
        return context.succeed(builtPolicy);
    })
    .catch((err) => {
        console.log(err);
        return context.fail('Unauthorized');
    });
};
