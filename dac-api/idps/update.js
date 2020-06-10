'use strict';
const lib = require('../lib/index.js');

module.exports.handler = async (event, context) => {
    async function updateIdp(id, payload) {
        let result = {};
        let kid = payload.protocol.credentials.trust.kid;

        if (payload.protocol.credentials.trust.kid == '')
            payload.x5c = [process.env.TEMPLATE_CERT];

        if (payload.x5c) {
            try {
                kid = await lib.addKey(payload.x5c);
            } catch (e) {
                // do nothing;
            }
            delete payload.x5c;
        }
        try {
            payload.protocol.credentials.trust.kid = kid;
            if (!payload.name.startsWith(lib.DAC_PREFIX)) payload.name = lib.DAC_PREFIX + payload.name;

            const res = await lib.axios.put(lib.orgUrl + '/api/v1/idps/' + id, payload, lib.headers);
            result.status = res.status;
            let data = res.data;
            delete data._links;
            result.data = data;
        } catch (e) {
            throw e;
        }
        return result;
    }

    const response = {
        isBase64Encoded: false,
        headers: {
            "Access-Control-Allow-Origin": "*"
        }
    };
    try {
        const res = await updateIdp(event.pathParameters.idpId, JSON.parse(event.body));
        response.statusCode = res.status;
        response.body = JSON.stringify(res.data);

    } catch (e) {
        console.log(e);
        response.statusCode = e.response.status;
        response.body = JSON.stringify(e.response.data);
    }
    return response;
};