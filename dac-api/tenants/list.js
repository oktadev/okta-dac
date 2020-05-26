'use strict';
const lib = require('../lib/index.js')

module.exports.handler = async (event, context) => {
    async function listTenants(after) {
        try {        
            let url = lib.orgUrl + '/api/v1/idps?limit=30';
            if (after) url += '&after=' + after;
            const res = await lib.axios.get(url, lib.headers);
            if (res.status == 200 && res.data.length > 0) {
                return {
                    status: 200,
                    data: res.data.filter(idp => {
                            return idp.name.startsWith('MTA_');
                        })
                        .map(idp => {
                            return {
                                id: idp.id,
                                name: idp.name.split('MTA_')[1].split('_')[0],
                                created: idp.created
                            };
                        }),
                    headers: res.headers
                };
            }      
        } catch (e) {
            throw e;
        }
        // did not find tenant (did not return 200). Return a custom 404 response
        throw lib.standardResponses.notFound;    
    }
    
    async function searchTenants(search) {
        try {
            const res = await lib.axios.get(lib.orgUrl + '/api/v1/groups?q=ADMINS_' + search, lib.headers);
            if (res.data.length == 0) return {
                status: 200,
                data: []
            };
    
            return {
                status: res.status,
                data: res.data.map(grp => {
                    return {
                        id: JSON.parse(grp.profile.description).tenantId,
                        name: grp.profile.name.split('ADMINS_')[1],
                        ADMINS_groupId: grp.id,
                        created: grp.created
                    };
                })
            };
        } catch (e) {
            throw e;
        }
    }
    
    const response = {
        isBase64Encoded: false,
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Expose-Headers": "Link, link"
        }
    };

    try {
        let res = undefined;
        if (event.queryStringParameters) {
            if (event.queryStringParameters.after) {
                // GET tenants?after={after}
                res = await listTenants(event.queryStringParameters.after);
            } else if (event.queryStringParameters.search) {
                // GET tenants?search={search}
                res = await searchTenants(event.queryStringParameters.search);
            } else {
                // GET tenants
                res = await listTenants();
            }
        } else {
            // GET tenants
            res = await listTenants();
        }
        response.statusCode = res.status;
        response.body = JSON.stringify(res.data);
        if (res.headers && res.headers.link)
            response.headers.Link = res.headers.link;
    } catch (e) {
        console.log(e);
        response.statusCode = e.response.status;
        response.body = JSON.stringify(e.response.data);
    }
    return response;
};