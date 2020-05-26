'use strict';
const lib = require('../../lib/index.js')

module.exports.handler = async (event, context) => {

    async function unassignTenantApp(tenant, appId) {
        try {
            const grp = await lib.axios.get(lib.orgUrl + '/api/v1/groups?q=APPUSERS_' + tenant + '_' + appId, lib.headers);
            if (grp.status == 200 && grp.data.length == 1) {
                const res = await lib.axios.delete(
                    lib.orgUrl + '/api/v1/groups/' + grp.data[0].id,
                    lib.headers
                );
                return res;
            } else {
                throw {
                    response: {
                        status: 400,
                        data: {
                            message: 'Group search returned non unique result'
                        }
                    }
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
        const res = await unassignTenantApp(event.pathParameters.tenant, event.pathParameters.appId);
        response.statusCode = res.status;
        response.body = JSON.stringify(res.data);
    } catch (e) {
        console.log(e);
        response.statusCode = e.response.status;
        response.body = JSON.stringify(e.response.data);
    }
    return response;
};
