'use strict';
const lib = require('../../lib/index.js');
const addTenantDomain = require('./add.js');
const deleteTenantDomain = require('./delete.js');

module.exports.handler = async (event, context) => {

    async function verifyDomain(tenant, domain, dnsVerificationString) {
        try {
            const grp = await lib.getAdminsGroup(tenant);
            const meta = JSON.parse(grp.data.profile.description);
            if (meta.inactiveRoutingRuleId) {
                const dnsLookup = await lib.axios.get(
                    `https://dns.google/resolve?name=${process.env.DNS_VERIFY_PREFIX}.${domain}&type=16`
                );
                console.log("DNS Lookup", JSON.stringify(dnsLookup.data));
                let verified = false;
                if (dnsLookup.data.Answer) {
                    dnsLookup.data.Answer.forEach(dns => {
                        if (dns.data === `"${dnsVerificationString}"`) verified = true;
                    });
                }
                if (verified) {
                    await deleteTenantDomain.deleteTenantDomain(tenant, domain, grp);
                    await addTenantDomain.addTenantDomain(tenant, {
                        domain: domain,
                        verified: true
                    }, grp);
                    return {
                        status: 200,
                        data: {
                            verified: true,
                            domain: domain
                        }
                    };
                } else {
                    return {
                        status: 200,
                        data: {
                            verified: false,
                            domain: domain
                        }
                    };
                }
            } else {
                throw notFound;
            }
        } catch (e) {
            console.log(e);
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
        const res = await verifyDomain(
            event.pathParameters.tenant, 
            event.pathParameters.domain, 
            JSON.parse(event.body).dnsVerificationString
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
