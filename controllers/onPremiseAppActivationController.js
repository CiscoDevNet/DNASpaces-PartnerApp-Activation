var atob = require('atob');
let jwt = require('jsonwebtoken')
let https = require('https');
let properties = require('../conf/oauth-properties.json');

/* Get partner information for given access token */
exports.activateOnPremiseApp = function (req, res) {
    console.log("******* activateOnPremiseApp method called *********");
    let body = req.body;
    let activationKey = body.activationKey;
    let base64Url = activationKey.split('.')[1];
    console.log("base64Url : ",base64Url);
    if(base64Url === undefined){
        res.render('setup/activate.ejs', { message: "The activation key is not valid."});
    }
    let base64 = base64Url.replace('-', '+').replace('_', '/');
    let payload = JSON.parse(atob(base64));
    console.log('******* activateOnPremiseApp: Payload  ******** ',payload);
    let params = {
        'algorithms': ['RS256']
    }
    console.log('******* Going to do API call to fetch Public Key ******** ');

    var baseUrl = payload.baseUrl
    var baseDomain = baseUrl.split('//')[1];
    console.log(" ******* baseDomain ********", baseDomain)
    
    var options = {
        hostname: baseDomain,
        port: 443,
        path: '/client/v1/partner/partnerPublicKey',
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    };
    console.log('options::', options); 
    var get_req = https.request(options, function (pubkeyRes) {
        var body = '';
        pubkeyRes.on('data', function (chunk) {
            body += chunk;
        });
        pubkeyRes.on('end', function () {
            try {
                let result = JSON.parse(body);
                console.log("******* On Premise Public Key *****", result);
                
                if(result.status && result.data && result.data.length){
                    var partnerKeyList = result.data;
                    var latestVersion = "v"+partnerKeyList.length;
                    var pubKey = null;
                    for(let verionObj of partnerKeyList) {
                        if(verionObj['version'] === latestVersion) {
                            pubKey = verionObj['publicKey'];
                            console.log("******* Matched Latest Version *****", latestVersion);
                        }
                    }
                    if(pubKey) {
                        var publicKey = "-----BEGIN PUBLIC KEY-----\n" + pubKey + "\n-----END PUBLIC KEY-----";
                        jwt.verify(activationKey, publicKey, params, function (err, decoded) {
                            console.log("***** On Premise Token Verification Error ******",JSON.stringify(err));
                            console.log("***** On Premise JWT Token ******", decoded);
                            if(decoded != undefined && decoded != null)
                                // doActivateOnPremiseApp(req, res, decoded, baseDomain, activationKey)
                                res.render('setup/showDetails.ejs', { customer: decoded.customer, activationKey: activationKey});
                            else{
                                console.log("******* Token Error Message *****", err["message"]);
                                res.render('setup/activate.ejs', { message: err["message"]});
                            }
                        });
                    }else{
                        console.log("******* Failed to extract partner public key  *****");
                        const message = "Failed to extract partner public key";
                        res.render('commonError.ejs', {message: message} );
                        res.end();
                    } 
                }else{
                    console.log("******* Failed to get partner public key from APIs *****");
                    const message = "Failed to get partner public key from APIs";
                    res.render('commonError.ejs', {message: message} );
                    res.end();
                }         
            } catch (e) {
                console.log("Below is the error while parsing the body");
                console.log(e);
                console.log('options::', options, 'post_data', postData, 'body', body);
            }
        });
        pubkeyRes.on('error', function (err) {
            console.log("***** error ******", err);
        });
    })
        .on('error', function (err) {
            console.log("***** error ******", err);
        });
    get_req.end();   
}


exports.doActivateOnPremiseApp = function(req, res) {
    console.log("******* doActivateOnPremiseApp method called *********");
    let body = req.body;
    let activationKey = body.activationKey;
    let base64Url = activationKey.split('.')[1];
    console.log("doActivateOnPremiseApp :: base64Url : ",base64Url);
    if(base64Url === undefined){
        res.render('setup/activate.ejs', { message: "The activation key is not valid."});
    }
    let base64 = base64Url.replace('-', '+').replace('_', '/');
    let payload = JSON.parse(atob(base64));
    console.log('******* doActivateOnPremiseApp: Payload  ******** ',payload); 
    var baseUrl = payload.baseUrl
    var baseDomain = baseUrl.split('//')[1];
    console.log(" ******* baseDomain ********", baseDomain)
    let appId = payload.appId
    let activationRefId = payload.activationRefId
    let postData = {
        'appId': appId,
        'activationRefId': activationRefId
    };
    var options = {
        hostname: baseDomain,
        port: 443,
        path: '/client/v1/partner/activateOnPremiseApp',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer '+activationKey
        }
    };
    console.log('options::', options, 'post_data', postData); 
    var post_req = https.request(options, function (pubkeyRes) {
        var body = '';
        pubkeyRes.on('data', function (chunk) {
            body += chunk;
        });
        pubkeyRes.on('end', function () {
            try {
                let result = JSON.parse(body);
                console.log("******* On Premise Activation API Key *****", result);
                if(result.status){
                    let resultObj = {...result.data};
                    res.render('setup/complete.ejs', { message: result.message, apiData: resultObj});
                }else{
                    res.render('setup/activate.ejs', { message: result.message});
                } 
            } catch (e) {
                console.log("Below is the error while parsing the body");
                console.log(e);
                console.log('options::', options, 'post_data', postData, 'body', body);
            }
        });
        pubkeyRes.on('error', function (err) {
            console.log("***** error ******", err);
        });
    })
        .on('error', function (err) {
            console.log("***** error ******", err);
        });
    if (postData)
        post_req.write(JSON.stringify(postData));
    post_req.end();   
}    

exports.activationKeyDashboard = function (req, res) {
    console.log("******** Going to activationKeyDashboard page **********");
    res.render('setup/activate.ejs', { message: ""});
}  

exports.setupHome = function (req, res) {
    console.log("******** Going to activationSteps page **********");
    res.render('setup/trigueHome.ejs', { message: ""});
}  

exports.setupSteps = function (req, res) {
    console.log("******** Going to activationSteps page **********");
    res.render('setup/setup.ejs', { message: ""});
}  
