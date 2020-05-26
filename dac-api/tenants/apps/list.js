'use strict';
const lib = require('../../lib/index.js')

async function getTenantApps(tenant) {

    async function filterAppsById(ids) {
        if (Object.keys(ids).length === 0 && ids.constructor === Object)
            return {
                status: 200,
                data: []
            };

        try {
            const res = await lib.axios.get(lib.orgUrl + '/api/v1/apps', lib.headers);
            let filtered = [];
            for (const app of res.data) {
                if (ids[app.id]) {
                    app.groupId = ids[app.id];
                    filtered.push(app);
                }
            }
            return {
                status: res.status,
                data: filtered.map(app => {
                    return {
                        id: app.id,
                        APPUSERS_groupId: app.groupId,
                        name: app.label.split('MTA_')[1],
                        // profile: app.profile,
                        created: app.created,
                        lastUpdated: app.lastUpdated,
                        logo: app._links.logo
                    };
                })
            };
        } catch (e) {
            return e.response;
        }
    }

    try {
        // check tenant exists or throw 404
        await lib.getAdminsGroup(tenant, null);

        const query = '?q=APPUSERS_' + tenant;
        // tenant does exist
        const res = await lib.axios.get(lib.orgUrl + '/api/v1/groups' + query + '&expand=stats', lib.headers);
        const filtered = res.data.filter(grp => {
            return (grp._embedded.stats.appsCount > 0);
        });
        let ids = {};
        for (const grp of filtered) {
            ids[grp.profile.name.split("_")[2]] = grp.id;
        }
        return await filterAppsById(ids);
    } catch (e) {
        throw e;
    }
}

module.exports.getTenantApps = getTenantApps;

module.exports.handler = async (event, context) => {
    const response = {
        isBase64Encoded: false,
        headers: {
            "Access-Control-Allow-Origin": "*"
        }
    };
    try {
        const tenant = event.pathParameters.tenant;
        const res = await getTenantApps(tenant);
        response.statusCode = res.status;
        response.body = JSON.stringify(res.data);
    } catch (e) {
        console.log(e);
        response.statusCode = e.response.status;
        response.body = JSON.stringify(e.response.data);
    }
    return response;
};