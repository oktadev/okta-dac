'use strict';
const lib = require('../../lib/index.js');

module.exports.handler = async (event, context) => {

    async function getTenantAdmins(tenant) {
        try {
            // check tenant exists or throw 404
            const pre = await lib.getAdminsGroup(tenant, null);
            const res = await lib.axios.get(lib.orgUrl + '/api/v1/groups/' + pre.data.id + '/users', lib.headers);
            return {
                status: res.status,
                data: res.data.map(grp=>{
                    delete grp._links;
                    delete grp.type;
                    delete grp.profile.mobilePhone;
                    delete grp.profile.secondEmail;
                    delete grp.profile.login;
                    return grp;
                })
            };
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
        const res = await getTenantAdmins(event.pathParameters.tenant);
        response.statusCode = res.status;
        response.body = JSON.stringify(res.data);
    } catch (e) {
        console.log(e);
        response.statusCode = e.response.status;
        response.body = JSON.stringify(e.response.data);
    }
    return response;    
};
