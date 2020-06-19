'use strict';
const lib = require('../lib/index.js');
const appClientId = process.env.CLIENT_ID;


module.exports.handler = async (event, context) => {
    async function addGroup(name, tenantId) {
        try {
            const res = await lib.axios.post(
                lib.orgUrl + '/api/v1/groups', {
                    profile: {
                        name: name,
                        description: JSON.stringify({
                            tenantId: tenantId
                        })
                    }
                },
                lib.headers
            );
            return res;
        } catch (e) {
            throw e;
        }
    }
    
    async function addUserAdminRole(groupId) {
        try {
            const res = await lib.axios.post(lib.orgUrl + '/api/v1/groups/' + groupId + '/roles', {
                type: 'USER_ADMIN'
            }, lib.headers);
            return res;
        } catch (e) {
            throw e;
        }
    }
    
    async function assignGroupToApp(groupId, tenantId, tenantName, usersGroupId) {
        try {
            const res = await lib.axios.put(
                lib.orgUrl + '/api/v1/apps/' + appClientId + '/groups/' + groupId, {
                    profile: {
                        tenants: [
                            tenantId + ":" + tenantName + ':' + usersGroupId
                        ]
                    }
                },
                lib.headers
            );
            return res;
        } catch (e) {
            throw e;
        }
    }
    
    async function updateTenantJitGroupAndInactivate(id, groupId) {
        try {
            const res = await lib.axios.get(lib.orgUrl + '/api/v1/idps/' + id, lib.headers);
            let payload = res.data;
            delete payload._links;
            delete payload.id;
            delete payload.created;
            delete payload.lastUpdated;
            payload.policy.provisioning.groups.action = 'ASSIGN';
            payload.policy.provisioning.groups.assignments = [groupId];
            payload.status = 'INACTIVE';
            const res2 = await lib.axios.put(lib.orgUrl + '/api/v1/idps/' + id, payload, lib.headers);
            return res2;
        } catch (e) {
            console.log(e);
            throw e;
        }
    }
    
    async function addTenant(name) {
        if (!name || name.length <= 0) {
            throw lib.standardResponses.malformedRequest;
        }
    
        try {
            const res = await lib.getAdminsGroup(name, null);
            if (res.status == 200) {
                return {
                    status: 400,
                    data: {
                        message: 'tenant ' + name + ' already exists'
                    }
                };
            }
        } catch (e) {
            if (e.response.status != 404) {
                throw e;
            }
        }
    
        try {
            const kid = await lib.addKey([process.env.TEMPLATE_CERT]);
    
            const res = await lib.axios.post(
                lib.orgUrl + '/api/v1/idps', {
                    type: "SAML2",
                    name: lib.DAC_PREFIX + name,
                    status: "INACTIVE",
                    protocol: {
                        type: "SAML2",
                        endpoints: {
                            sso: {
                                url: "https://placeholder",
                                binding: "HTTP-POST",
                                destination: "https://template"
                            },
                            acs: {
                                binding: "HTTP-POST",
                                type: "INSTANCE"
                            }
                        },
                        algorithms: {},
                        credentials: {
                            trust: {
                                issuer: "placeholder",
                                kid: kid
                            }
                        }
                    },
                    policy: {
                        provisioning: {
                            action: "AUTO",
                            groups: {
                                action: "NONE"
                            }
                        },
                        subject: {
                            userNameTemplate: {
                                template: "idpuser.subjectNameId"
                            },
                            matchType: "USERNAME"
                        },
                        maxClockSkew: 120000
                    }
                },
                lib.headers
            );
            if (res.status == 200) {
                const allUsers = await addGroup('USERS_' + name, res.data.id);
                const admins = await addGroup('ADMINS_' + name, res.data.id);
                const role = await addUserAdminRole(admins.data.id);
                await lib.addGroupAdminTarget(admins.data.id, role.data.id, allUsers.data.id);
                await lib.addGroupAdminTarget(admins.data.id, role.data.id, admins.data.id);
                await assignGroupToApp(admins.data.id, res.data.id, name, allUsers.data.id);
                await updateTenantJitGroupAndInactivate(res.data.id, allUsers.data.id);
    
                return {
                    status: 201,
                    data: {
                        id: res.data.id,
                        ADMINS_groupId: admins.data.id,
                        USERS_groupId: allUsers.data.id,
                        ADMINS_roleId: role.data.id,
                        name: name,
                        created: res.data.created,
                        lastUpdated: res.data.lastUpdated
                    }
                };
            }
        } catch (e) {
            throw e;
        }
    }    


    const response = {
        isBase64Encoded: false,
        headers: {
            "Access-Control-Allow-Origin": "*"
        }
    };
    try {
        const requestBody = JSON.parse(event.body);
        const res = await addTenant(requestBody.name);
        response.statusCode = res.status;
        response.body = JSON.stringify(res.data);
    } catch (e) {
        console.log(e);
        response.statusCode = e.response.status;
        response.body = JSON.stringify(e.response.data);
    }
    return response;
};