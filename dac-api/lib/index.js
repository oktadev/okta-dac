const standardResponses = require ('./standardResponses.js')
const axios = require('axios');
const orgUrl = process.env.ISSUER.split("/oauth2")[0];
const headers = {
    headers: {
        Authorization: 'SSWS ' + process.env.OKTA_API_KEY
    }
};

async function getAdminsGroup(name) {
    try {        
        const res = await axios.get(orgUrl + '/api/v1/groups?q=ADMINS_' + name + '&limit=2', headers);
        if (res.status == 200 && res.data.length == 1 && res.data[0].profile.name == 'ADMINS_' + name) {
            let body = res.data[0];
            delete body._links;
            return {
                status: 200,
                data: body
            };
        }        
    } catch (e) {
        throw e;
    }
    // did not find tenant (did not return 200). Return a custom 404 response
    throw standardResponses.notFound;
}

async function addKey(x5c) {
    try {
        const keyData = await axios.post(orgUrl + '/api/v1/idps/credentials/keys', {
            x5c: x5c
        }, headers);
        if (keyData.status == '200') {
            const kid = keyData.data.kid;
            console.log('successfully added kid: ' + kid);
            return kid;
        }
    } catch (e) {
        console.log(e);
        if (e.response.status == '409') {
            const kid = e.response.data.errorSummary.split('kid=')[1].split('.')[0];
            console.log('existing kid: ' + kid);
            return kid;
        }
        // else if (e.response.data.errorSummary && e.response.data.errorSummary.includes("JsonWebKeyRSAMediated")) {

        // } 
        else {
            console.log('addKey ERROR');
            console.log(e);
            throw e;
        }
    }
}

async function addGroupAdminTarget(groupId, roleId, targetId) {
    try {
        const res = await axios.put(
            orgUrl + '/api/v1/groups/' + groupId + '/roles/' + roleId + '/targets/groups/' + targetId,
            null,
            headers
        );
        return res;
    } catch (e) {
        throw e;
    }
}

module.exports = {
    orgUrl, headers, axios, standardResponses, 
    getAdminsGroup, 
    addKey, 
    addGroupAdminTarget
}