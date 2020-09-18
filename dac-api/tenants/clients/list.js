'use strict';
const lib = require('../../lib/index.js')

module.exports.handler = async (event, context) => {
    const response = {
        isBase64Encoded: false,
        headers: {
            "Access-Control-Allow-Origin": "*"
        }
    };
    try {
        let res = await lib.axios.get(
            lib.orgUrl + '/oauth2/v1/clients?q=' + `DAC_${event.pathParameters.tenant}_`,
            lib.headers
        );
        response.statusCode = res.status;
        response.body = JSON.stringify(res.data);
    } catch (e) {
        console.log(e);
        response.statusCode = e.response.status;
        response.body = JSON.stringify(e.response.data);
    }
    return response;
};