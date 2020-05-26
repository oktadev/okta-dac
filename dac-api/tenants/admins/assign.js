'use strict';
const lib = require('../../lib/index.js');

module.exports.handler = async (event, context) => {

    async function addTenantAdmin(tenant, userId) {
        try {
            const pre = await lib.getAdminsGroup(tenant, null);
            const grps = await lib.axios.get(
                lib.orgUrl + '/api/v1/users/' + userId + '/groups',
                lib.headers
            );

            const filtered = grps.data.filter(grp => {
                return (grp.profile.name.startsWith('USERS_' + tenant));
            });
            // assert that user is in the tenant
            if (filtered.length <= 0)
                throw lib.standardResponses.notAuthoried;

            const res = await lib.axios.put(
                lib.orgUrl + '/api/v1/groups/' + pre.data.id + '/users/' + userId,
                null,
                lib.headers
            );
            return {
                status: res.status,
                data: {
                    tenant: tenant,
                    userId: pre.data.id,
                    assigned: res.data.lastUpdated
                }
            };
        } catch (e) {
            return e.response;
        }
    }
    const response = {
        isBase64Encoded: false,
        headers: {
            "Access-Control-Allow-Origin": "*"
        }
    };
    try {
        const res = await addTenantAdmin(event.pathParameters.tenant, event.pathParameters.userId);
        response.statusCode = res.status;
        response.body = JSON.stringify(res.data);
    } catch (e) {
        console.log(e);
        response.statusCode = e.response.status;
        response.body = JSON.stringify(e.response.data);
    }
    return response;    
};
