'use strict';
const lib = require('../../lib/index.js')

async function getTenantApps(tenant, claims) {
    async function filterAppsById(ids, allUsersApps) {
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
                        created: app.created,
                        lastUpdated: app.lastUpdated,
                        logo: app._links.logo,
                        settings: allUsersApps.includes(app.id) ? { allUsers: true } : { allUsers: false }
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

        let allUsersApps = [];
        let tenants = []
        if (claims.tenants)
            tenants = JSON.parse(claims.tenants);
        for (const t of tenants) {
            const usersGroupId = t.split(':')[2];
            const res = await lib.axios.get(lib.orgUrl + '/api/v1/groups/' + usersGroupId + '/apps', lib.headers);
            allUsersApps = allUsersApps.concat(res.data.map(app=>{return app.id}));
        }
        const res = await lib.axios.get(
            lib.orgUrl + '/api/v1/groups?q=APPUSERS_' + tenant + '&expand=stats', 
            lib.headers
        );
        const filtered = res.data.filter(grp => {
            return (grp._embedded.stats.appsCount > 0);
        });
        let ids = {};
        for (const grp of filtered) {
            ids[grp.profile.name.split("_")[2]] = grp.id;
        }
        return await filterAppsById(ids, allUsersApps);
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
        const res = await getTenantApps(
            event.pathParameters.tenant, 
            event.requestContext.authorizer
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