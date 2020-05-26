'use strict';
const lib = require('../lib/index.js');

async function getIdp(id) {
    let result = {};
    try {
        const res = await lib.axios.get(lib.orgUrl + '/api/v1/idps/' + id, lib.headers);
        result.data = res.data;
        result.data.name = result.data.name.split('MTA_')[1];
        delete result.data._links.metadata;
        delete result.data._links.users;
        delete result.data._links.deactivate;

        const kid = result.data.protocol.credentials.trust.kid;
        const key = await lib.axios.get(lib.orgUrl + '/api/v1/idps/credentials/keys/' + kid, lib.headers);
        const index = key.data.x5c.findIndex(cert => {
            return (cert == process.env.TEMPLATE_CERT);
        });
        if (index < 0) result.data.x5c = key.data.x5c;
        result.status = 200;
    } catch (e) {
        throw e;
    }
    return result;
}

module.exports.getIdp = getIdp;

module.exports.handler = async (event, context) => {
    const response = {
        isBase64Encoded: false,
        headers: {
            "Access-Control-Allow-Origin": "*"
        }
    };
    try {
        const res = await getIdp(event.pathParameters.idpId);
        response.statusCode = res.status;
        response.body = JSON.stringify(res.data);
    } catch (e) {
        console.log(e);
        response.statusCode = e.response.status;
        response.body = JSON.stringify(e.response.data);
    }
    return response;
};