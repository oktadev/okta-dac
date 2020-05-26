'use strict';
const lib = require('../lib/index.js');

exports.handler = async function (event, context) {
    const response = {
        isBase64Encoded: false,
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Expose-Headers": "Link, link"
        },
    };
    const requestString = lib.orgUrl + "/api/v1/" + event.pathParameters.proxy;
    let requestBody = JSON.parse(event.body);

    try {
        let config = {
            method: event.httpMethod,
            url: requestString,
            data: requestBody,
            headers: {
                Authorization: event.headers.Authorization || ""
            }
        };
        if (event.queryStringParameters)
            config.params = event.queryStringParameters;

        const res = await lib.axios(config);
        if (res.headers && res.headers.link)
            response.headers.Link = res.headers.link;

        response.statusCode = res.status;
        response.body = JSON.stringify(res.data);
    } catch (err) {
        response.statusCode = err.response.status;
        response.body = JSON.stringify(err.response.data);
    }
    return response;
};