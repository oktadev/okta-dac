'use strict';
const getIdp = require('./get.js');

module.exports.handler = async (event, context) => {
    const response = {
        isBase64Encoded: false,
        headers: {
            "Access-Control-Allow-Origin": "*"
        }
    };
    try {
        let authorized = event.requestContext.authorizer.tenants;
        let data = [];
        authorized = JSON.parse(authorized);
        for (const idp of authorized) {
            const id = idp.split(':')[0];
            const res = await getIdp.getIdp(id);
            response.statusCode = res.status;
            data.push(res.data);
        }
        response.body = JSON.stringify(data);
    } catch (e) {
        console.log(e);
        response.statusCode = e.response.status;
        response.body = JSON.stringify(e.response.data);
    }
    return response;
};