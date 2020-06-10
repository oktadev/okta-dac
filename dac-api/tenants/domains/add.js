'use strict';
const lib = require('../../lib/index.js');
const uuid = require("uuid4");

async function addTenantDomain(tenant, requestPayload, obj) {
    async function addTenantDomainCheckDupAndFilter(ruleId, domain) {
        const url = lib.orgUrl + '/api/v1/policies/' + process.env.IDP_DISCO_POLICY_ID + '/rules';
        const res = await lib.axios.get(url, lib.headers);
        let filteredRule = undefined;
        res.data.forEach(rule => {
            if (ruleId && rule.id === ruleId) filteredRule = rule;
    
            if (rule.status === 'ACTIVE') {
                rule.conditions.userIdentifier.patterns.forEach(pattern => {
                    if (pattern.matchType === 'SUFFIX' && domain === pattern.value) {
                        throw {
                            response: {
                                status: 409,
                                data: {
                                    error: "Requested Domain already exists"
                                }
                            }
                        };
                    }
                });
            }
        });
        return filteredRule;
    }
    
    try {
        let grp = obj;
        if (!grp) grp = await lib.getAdminsGroup(tenant);

        let domain = undefined;
        const meta = JSON.parse(grp.data.profile.description)
        let whichId = undefined;
        let uid = undefined;
        let activate = ''
        if (requestPayload.verified) {
            whichId = 'routingRuleId';
            activate = '?activate=true';
            domain = requestPayload.domain;
        } else {
            whichId = 'inactiveRoutingRuleId';
            activate = '?activate=false';
            uid = uuid();
            domain = uid + '.' + requestPayload.domain;
        }

        if (meta[whichId]) {
            let payload = await addTenantDomainCheckDupAndFilter(meta[whichId], requestPayload.domain);
            delete payload._links;
            delete payload.id;
            delete payload.created;
            delete payload.lastUpdated;
            payload.conditions.userIdentifier.patterns.push({
                matchType: 'SUFFIX',
                value: domain
            });
            await lib.axios.put(lib.orgUrl + '/api/v1/policies/' + process.env.IDP_DISCO_POLICY_ID + '/rules/' + meta[whichId], payload, lib.headers);
        } else {
            await addTenantDomainCheckDupAndFilter(null, requestPayload.domain);
            const rule = await lib.axios.post(
                lib.orgUrl + '/api/v1/policies/' + process.env.IDP_DISCO_POLICY_ID + '/rules' + activate, {
                    type: "IDP_DISCOVERY",
                    name: lib.DAC_PREFIX + tenant + (requestPayload.verified ? "" : "_unverified"),
                    actions: {
                        idp: {
                            providers: [{
                                type: "SAML2",
                                id: meta.tenantId
                            }]
                        }
                    },
                    conditions: {
                        userIdentifier: {
                            patterns: [{
                                matchType: "SUFFIX",
                                value: domain
                            }],
                            type: "IDENTIFIER"
                        }
                    }
                },
                lib.headers
            );
            let payload2 = grp.data;
            delete payload2.created;
            delete payload2.lastUpdated;
            delete payload2.lastMembershipUpdated;
            let desc = JSON.parse(payload2.profile.description);
            desc[whichId] = rule.data.id;
            payload2.profile.description = JSON.stringify(desc);
            await lib.axios.put(lib.orgUrl + '/api/v1/groups/' + payload2.id, payload2, lib.headers);
        }
        return {
            status: 201,
            data: {
                domain: requestPayload.domain,
                dnsVerificationString: uid
            }
        };
    } catch (e) {
        // if (e.status === 409) {
        //     return {
        //         status: 400,
        //         data: e.response.data
        //     };
        // }
        throw e;
    }
}

module.exports.addTenantDomain = addTenantDomain;

module.exports.handler = async (event, context) => {
    const response = {
        isBase64Encoded: false,
        headers: {
            "Access-Control-Allow-Origin": "*"
        }
    };
    try {
        const res = await addTenantDomain(event.pathParameters.tenant, JSON.parse(event.body));
        response.statusCode = res.status;
        response.body = JSON.stringify(res.data);
    } catch (e) {
        console.log(e);
        response.statusCode = e.response.status;
        response.body = JSON.stringify(e.response.data);
    }
    return response;
};
