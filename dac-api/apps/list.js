'use strict';
const lib = require('../lib/index.js');
const getTenantApps = require('../tenants/apps/list.js');

module.exports.handler = async (event, context) => {
    
    async function listApps(claims) {
        let res = undefined;
        let filtered = [];
        const groups = JSON.parse(claims.groups);
        try {
            if (groups.includes('SUPERUSERS')) {
                const url = lib.orgUrl + '/api/v1/apps';
                res = await lib.axios.get(url, lib.headers);
                filtered = res.data.filter(app => {
                    return (app.label.startsWith('MTA_'));
                });
            } else {
                const tenants = JSON.parse(claims.tenants);
                if (tenants && tenants.length > 0) {
                    for (const tenant of tenants) {
                        res = await getTenantApps.getTenantApps(
                            tenant.split(':')[1],
                            event.requestContext.authorizer
                        );
                        filtered = filtered.concat(res.data);
                    }
                }
            }
        } catch (e) {
            throw e;
        }
        const data = filtered.map(app => {
            return {
                id: app.id,
                APPUSERS_groupId: app.APPUSERS_groupId,
                name: app.label ? app.label.split('MTA_')[1] : app.name,
                created: app.created,
                lastUpdated: app.lastUpdated,
                logo: app.logo ? app.logo : app._links.logo,
                settings: app.settings
            };
        });
        return {
            status: res.status,
            data: data
        };
    }

    const response = {
        isBase64Encoded: false,
        headers: {
            "Access-Control-Allow-Origin": "*"
        }
    };
    try {
        const res = await listApps(event.requestContext.authorizer);
        response.statusCode = res.status;
        response.body = JSON.stringify(res.data);
    } catch (e) {
        console.log(e);
        response.statusCode = e.response.status;
        response.body = JSON.stringify(e.response.data);
    }
    return response;
};