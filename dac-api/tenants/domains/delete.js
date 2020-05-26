'use strict';
const lib = require('../../lib/index.js');

async function deleteTenantDomain(tenant, domain, obj) {
    async function deleteTenantDomainHelper(domain, routingRuleId) {
        try {
            const url = lib.orgUrl + '/api/v1/policies/' + process.env.IDP_DISCO_POLICY_ID + '/rules/' + routingRuleId;
            const rule = await lib.axios.get(url, lib.headers);
            let payload = rule.data;
            const before = payload.conditions.userIdentifier.patterns;
            const domains = payload.conditions.userIdentifier.patterns.filter(pattern => {
                if (pattern.matchType !== 'SUFFIX')
                    return true;
                else {
                    const test = payload.status === 'ACTIVE' ?
                        pattern.value :
                        pattern.value.substring(pattern.value.indexOf('.') + 1);
                    return test !== domain;
                }
            });
            if (domains.length > 0) {
                payload.conditions.userIdentifier.patterns = domains;
                delete payload.id;
                delete payload._links;
                delete payload.created;
                delete payload.lastUpdated;
                await lib.axios.put(url, payload, lib.headers);
            } else {
                await lib.axios.delete(lib.orgUrl + '/api/v1/policies/' + process.env.IDP_DISCO_POLICY_ID + '/rules/' + routingRuleId, lib.headers);
            }
            return {
                domains: domains,
                status: before.length != domains.length ? 204 : 404
            };
        } catch (e) {
            throw e;
        }
    }

    try {
        let grp = obj;
        if (!grp) grp = await lib.getAdminsGroup(tenant);
        const meta = JSON.parse(grp.data.profile.description);

        let res = undefined;
        let whichId = undefined;
        if (meta.routingRuleId) {
            res = await deleteTenantDomainHelper(domain, meta.routingRuleId);
            if (res.status === 204) {
                whichId = 'routingRuleId';
            } else if (meta.inactiveRoutingRuleId) {
                // 2nd try: if didn't find it in the verified domain, then it must be an unverified domain
                res = await deleteTenantDomainHelper(domain, meta.inactiveRoutingRuleId, domain);
                if (res.status === 204) whichId = 'inactiveRoutingRuleId';
                else throw notFound;
            } else {
                throw notFound;
            }
        } else if (meta.inactiveRoutingRuleId) {
            res = await deleteTenantDomainHelper(domain, meta.inactiveRoutingRuleId, domain);
            if (res.status === 204) whichId = 'inactiveRoutingRuleId';
            else throw notFound;
        } else {
            throw notFound;
        }
        if (res.domains.length === 0) {
            let payload = grp.data;
            delete payload.created;
            delete payload.lastUpdated;
            delete payload.lastMembershipUpdated;
            let desc = JSON.parse(payload.profile.description);
            delete desc[whichId];
            payload.profile.description = JSON.stringify(desc);
            await lib.axios.put(lib.orgUrl + '/api/v1/groups/' + payload.id, payload, lib.headers);
        }
        return {
            status: 204
        };
    } catch (e) {
        console.log(e);
        throw e;
    }
}

module.exports.deleteTenantDomain = deleteTenantDomain;

module.exports.handler = async (event, context) => {
    const response = {
        isBase64Encoded: false,
        headers: {
            "Access-Control-Allow-Origin": "*"
        }
    };
    try {
        const res = await deleteTenantDomain(event.pathParameters.tenant, event.pathParameters.domain);
        response.statusCode = res.status;
        response.body = JSON.stringify(res.data);
    } catch (e) {
        console.log(e);
        response.statusCode = e.response.status;
        response.body = JSON.stringify(e.response.data);
    }
    return response;
};
