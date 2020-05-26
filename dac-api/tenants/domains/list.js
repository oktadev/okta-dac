'use strict';
const lib = require('../../lib/index.js')

module.exports.handler = async (event, context) => {
    async function getTenantDomainsHelper(routingRuleId) {
        if (!routingRuleId) return [];

        try {
            const res = await lib.axios.get(lib.orgUrl + '/api/v1/policies/' + process.env.IDP_DISCO_POLICY_ID + '/rules/' + routingRuleId, lib.headers);
            const domains = res.data.conditions.userIdentifier.patterns
                .filter(domain => {
                    return domain.matchType === 'SUFFIX';
                })
                .map(domain => {
                    return res.data.status === 'ACTIVE' ? {
                        domain: domain.value,
                        verified: true
                    } : {
                        domain: domain.value.substring(domain.value.indexOf('.') + 1),
                        verified: false,
                        dnsVerificationString: domain.value.split('.')[0]
                    };
                });
            return domains;
        } catch (e) {
            if (e.response.status === 404) {
                return [];
            } else {
                throw e;
            }
        }
    }

    async function getTenantDomains(tenant, verified) {
        try {
            const pre = await lib.getAdminsGroup(tenant);
            const meta = JSON.parse(pre.data.profile.description);
            if (verified === undefined) {
                const unverifiedDomains = await getTenantDomainsHelper(meta.inactiveRoutingRuleId);
                let allDomains = await getTenantDomainsHelper(meta.routingRuleId);
                return {
                    status: 200,
                    data: allDomains.concat(unverifiedDomains)
                };
            } else if (verified) {
                return {
                    status: 200,
                    data: await getTenantDomainsHelper(meta.routingRuleId)
                };
            } else {
                return {
                    status: 200,
                    data: await getTenantDomainsHelper(meta.inactiveRoutingRuleId)
                };
            }
        } catch (e) {
            throw e;
        }
    }

    const response = {
        isBase64Encoded: false,
        headers: {
            "Access-Control-Allow-Origin": "*"
        }
    };
    try {
        const tenant = event.pathParameters.tenant;
        let res = undefined;
        if (event.queryStringParameters) {
            if (event.queryStringParameters.verified === 'false') {
                // GET tenants/{tenant}/domains?verified=false
                res = await getTenantDomains(tenant, false);
            } else if (event.queryStringParameters.verified === 'true') {
                // GET tenants/{tenant}/domains?verified=true
                res = await getTenantDomains(tenant, true);
            } else {
                // GET tenants/{tenant}/domains
                res = await getTenantDomains(tenant);
            }
        } else {
            // GET tenants/{tenant}/domains
            res = await getTenantDomains(tenant);
        }
        response.statusCode = res.status;
        response.body = JSON.stringify(res.data);
    } catch (e) {
        console.log(e);
        response.statusCode = e.response.status;
        response.body = JSON.stringify(e.response.data);
    }
    return response;
};