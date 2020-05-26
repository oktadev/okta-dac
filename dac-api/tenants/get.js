'use strict';
const lib = require('../lib/index.js')

module.exports.handler = async (event, context) => {
    const response = {
        isBase64Encoded: false,
        headers: {
            "Access-Control-Allow-Origin": "*"
        }
    };
    try {
        const tenant = event.pathParameters.tenant;
        const res = await lib.getAdminsGroup(tenant);
        response.statusCode = res.status;
        response.body = JSON.stringify({
            id: JSON.parse(res.data.profile.description).tenantId,
            name: tenant,
            ADMINS_groupId: res.data.id,
            created: res.data.created    
        });
    } catch (e) {
        console.log(e);
        response.statusCode = e.response.status;
        response.body = JSON.stringify(e.response.data);
    }
    return response;
};