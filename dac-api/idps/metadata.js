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
        const res = await lib.axios.get(lib.orgUrl + '/api/v1/idps/' + event.pathParameters.idpId + '/metadata.xml', lib.headers);
        response.statusCode = res.status;
        response.body = JSON.stringify(res.data);
    } catch (e) {
        console.log(e);
        response.statusCode = e.response.status;
        response.body = JSON.stringify(e.response.data);
    }
    return response;
};