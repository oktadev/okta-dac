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
        // Check if the user can update this app
        let res2 = await lib.axios.get(
            lib.orgUrl + '/oauth2/v1/clients/' + event.pathParameters.clientId,
            lib.headers
        );
        if (res2.status !== 200) {
            response.statusCode = res2.status;
            response.body = JSON.stringify(res2.data);
        } else {
            let clientName = res2.data.client_name;
            console.log(clientName);
            if (clientName.startsWith("DAC_") && clientName.split("_").length > 1 && clientName.split("_")[1] === event.pathParameters.tenant) {
                let payload = JSON.parse(event.body);
                payload.client_name = `DAC_${event.pathParameters.tenant}_${payload.client_name}`;
                let res = await lib.axios.put(
                    lib.orgUrl + '/oauth2/v1/clients/' + event.pathParameters.clientId, payload,
                    lib.headers
                );
                response.statusCode = res.status;
                response.body = JSON.stringify(res.data);
            } else {
                response.statusCode = 403;
                response.body = "Forbidden access to client";
            }
        }
    } catch (e) {
        console.log(e);
        response.statusCode = e.response.status;
        response.body = JSON.stringify(e.response.data);
    }
    return response;
};