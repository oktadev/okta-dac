'use strict';
const lib = require('../../lib/index.js');

module.exports.handler = async (event, context) => {

    const response = {
        isBase64Encoded: false,
        headers: {
            "Access-Control-Allow-Origin": "*"
        }
    };
    try {
        let payload = JSON.parse(event.body);
        payload.client_name = `DAC_${event.pathParameters.tenant}_${payload.client_name}`;
        let res = await lib.axios.post(
            lib.orgUrl + '/oauth2/v1/clients', payload,
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