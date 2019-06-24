
var customerJsonProperties = require('../conf/customer.json');
var jwtTokenHelper = require('../util/jwtToken');
var cache = require('memory-cache');

/* Get partner information for given access token */
exports.getAppInfo = function (req, res) {
    console.log("******* getAppInfo method called *********");
    let partnerTenantIdFromQuery = req.query.partnerTenantId;
    let cachePartnerTenantId = cache.get(partnerTenantIdFromQuery)
    let partnerTenantId = null;
    console.log("******* getAppInfo : cachePartnerTenantId ******* ",cachePartnerTenantId);
    if(cachePartnerTenantId != null){
        partnerTenantId = cachePartnerTenantId;
    }else{
        partnerTenantId = partnerTenantIdFromQuery;
    }
    let accessToken = req.headers['authorization'];
    if (accessToken.startsWith('Bearer ')) {
        // Remove Bearer from string
        accessToken = accessToken.slice(7, accessToken.length);
    }
    console.log("partnerTenantId : " + partnerTenantId);
    console.log("accessToken : " + accessToken);
    let error = {
        message: "jwt expired"
    }
    try {
        let verifyToken = jwtTokenHelper.verifyToken(accessToken);
        if (verifyToken) {
            let customerJson = customerJsonProperties[partnerTenantId];
            let customerInfo = {
                "telemetry": customerJson.telemetry,
                "partnerTenantId": partnerTenantIdFromQuery,
                "userEmail": verifyToken.email,
                "supportEmail": customerJson.email
            }
            console.log("****** accessToken  *********" + JSON.stringify(customerInfo));
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(customerInfo));
        } else {
            return res.status(401).end(JSON.stringify(error));
        }
    } catch (e) {
        console.log("Token Expired INFO logs:: ", e);
        return res.status(401).end(JSON.stringify(error));
    }
}