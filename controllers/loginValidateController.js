
var userJsonProperties = require('../conf/user.json');
var customerJsonProperties = require('../conf/customer.json');
var customerClientIdJsonProperties = require('../conf/customer-clientId.json');
var properties = require('../conf/oauth-properties.json');
var jwtTokenHelper = require('../util/jwtToken');
var atob = require('atob');
var fs = require('fs');
var cache = require('memory-cache');

/* Get access token for successfull logged in user */
exports.getToken = function (req, res) {
    let body = req.body;
    let code = body.code;
    let grantType = body.grant_type;
    let redirectUri = body.redirect_uri;
    let clientId = body.client_id;

    /* Validate grant_type from the request  */
    if (grantType === 'authorization_code') {

        /* Validate redirect uri from the request  */
        let clientIdJson = customerClientIdJsonProperties[clientId];
        if (clientIdJson != null) {
            if (redirectUri === clientIdJson.redirectUri) {
                console.log("****** getAccessToken called *********" + code)
                let user = cache.get(code)
                console.log("****** internal cache *********" + user)

                if (user) {
                    console.log("Successfully validated the Auth code...." + JSON.stringify(user))
                    let userJsonParse = JSON.parse(user)
                    let partnerTenantId = null
                    let alternativePartnerTenantId = userJsonParse["alternativePartnerTenantId"]
                    console.log("******** alternativePartnerTenantId ******* ", alternativePartnerTenantId)
                    user = JSON.parse(user);
                    user["ver"] = "v1";
                    user["uid"] = code;
                    //Sanbox simulation customer can edit accountId on-demand
                    if(alternativePartnerTenantId != null)
                        partnerTenantId = alternativePartnerTenantId
                    else
                        partnerTenantId = userJsonParse["customer"]
                    console.log("****** user json *********" + JSON.stringify(user))
                    let accessToken = jwtTokenHelper.generateJwtToken(user);
                    console.log("****** accessToken  *********" + accessToken)
                    let response = {
                        "access_token": accessToken,
                        "token_type": "Bearer",
                        "scope": partnerTenantId
                    }
                    console.log("****** response *********" + JSON.stringify(response))
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify(response));
                } else {
                    console.log("Failed validated the Auth code...." + code)
                }
            } else {
                let error = {
                    message: "Redirect Uri is misconfigured."
                }
                return res.status(401).end(JSON.stringify(error));
            }
        } else {
            let error = {
                message: "Client Id is invalid.Please check the configuration."
            }
            return res.status(401).end(JSON.stringify(error));
        }
    } else {
        let error = {
            message: "The grant type is invalid"
        }
        return res.status(401).end(JSON.stringify(error));
    }
}

/* Load login page */
exports.login = function (req, res) {
    let clientId = req.query.client_id;
    let redirectUri = req.query.redirect_uri;
    let sandbox = (req.query.sandbox !== undefined && req.query.sandbox !== null)?req.query.sandbox:false;
    let customerPathKey = (req.query.customerPathKey !== undefined && req.query.customerPathKey !== null)?req.query.customerPathKey:null;
    console.log("****** clientId ******" + clientId)
    console.log("****** redirectUri ******" + redirectUri)
    let credentials = getCredentials(customerPathKey)
    console.log("****** admin credentials *******" + credentials);

    /* Validate redirect uri from the request  */
    let clientIdJson = customerClientIdJsonProperties[clientId];
    if (clientIdJson != null) {
        if (redirectUri === clientIdJson.redirectUri) {
            res.render('login.ejs', { message: "", credentials : credentials, sandbox : sandbox });
        } else {
            res.render('login.ejs', { message: "Redirect Uri is misconfigured.", credentials : credentials, sandbox : sandbox });
        }
    } else {
        res.render('login.ejs', { message: "Client Id is invalid.Please check the configuration.", credentials :credentials, sandbox : sandbox });
    }
}

/* Pre populate admin credentials in login page */
function getCredentials(customerPathKey){
    let userJson = userJsonProperties;
    let users = Object.keys(userJson);
    let adminEmail = null;
    let adminPassword = null;
    console.log("****** users *******", users);
    for(let i = 0; i < users.length; i++){
        if(users[i].startsWith('admin')){
            adminEmail = users[i];
        }
    }
    let userAdminJson = userJsonProperties[adminEmail];
    console.log("****** userAdminJson *******", userAdminJson);

    if(userAdminJson != null){
        adminPassword = userAdminJson.password;
    }
    let credentials = {
        email : adminEmail,
        password : adminPassword,
        partnerTenantId : customerPathKey
    }
    return credentials;
}
/* Validate login credentials */
exports.validateLogin = function (req, res) {
    let body = req.body;
    let redirectUri = req.query.redirect_uri;
    let clientId = req.query.client_id;
    let state = req.query.state;
    // let sandbox = (req.query.sandbox !== undefined && req.query.sandbox !== null)?req.query.sandbox:false;
    let customerPathKey = (req.query.customerPathKey !== undefined && req.query.customerPathKey !== null)?req.query.customerPathKey:null;
    
    let email = body.email;
    let password = body.password;
    let alternativePartnerTenantId = body.alternativePartnerTenantId;

    let userJson = userJsonProperties[email];
    const uuidv4 = require('uuid/v4');
    var keyValue = uuidv4();
    keyValue = keyValue.replace(/-/g, "").toUpperCase();

    console.log('****** body params ****' + JSON.stringify(req.body));
    console.log('****** alternativePartnerTenantId ****' + alternativePartnerTenantId);

    let credentials = getCredentials(customerPathKey)

    /* Validate redirect uri from the request */
    let clientIdJson = customerClientIdJsonProperties[clientId];
    if (clientIdJson != null) {
        if (redirectUri === clientIdJson.redirectUri) {
            if (userJson != null && userJson.password === password) {
                if (userJson.customer != null) {

                    /* Interal cache setting process goes here */
                    let user = {
                        email: email,
                        customer: userJson.customer,
                        alternativePartnerTenantId: alternativePartnerTenantId
                    }
                    console.log("****** Cache key *******", keyValue);
                    console.log("****** User Cache details ********",JSON.stringify(user));
                    cache.put(keyValue, JSON.stringify(user), 1800000, function (key, value) {
                        console.log(' Oauth code has setted into interal cache :: key : ' + key + ' Value :' + value);
                    });
                    let result = cache.get(keyValue)
                    console.log('internal value :: ' + result);

                    if(alternativePartnerTenantId != null){
                        let alternativePartnerTenantIdDeleteStatus = cache.del(alternativePartnerTenantId)
                        console.log('Cache delete status :: ' + alternativePartnerTenantIdDeleteStatus);
                        cache.put(alternativePartnerTenantId, userJson.customer, 2000000, function (key, value) {
                            console.log(' Alternative partner tenantId has setted into interal cache :: key : ' + key + ' Value :' + value);
                            let alternativePartnerTenantIdCache = cache.get(alternativePartnerTenantId)
                            console.log('Alternative partner tenantId internal value :: ' + alternativePartnerTenantIdCache);
                        });
                    }

                    /* Validate interal cache set correctly */
                    if (result) {
                        console.log('Oauth code has readed successfully from interal cache :: ' + result);
                    } else {
                        console.log('Failed to read oauth code from interal cache :: ');
                    }
                    res.writeHead(301, { Location: redirectUri + "?code=" + keyValue + "&state=" + state });
                    res.end();
                } else {
                    res.render('login.ejs', { message: "No customer is associated. Please try again.", credentials : credentials })
                }
            } else {
                console.log("Please provide the correct password.")
                res.render('login.ejs', { message: "Authentication Failure. Please try again.", credentials : credentials })
            }
        } else {
            res.render('login.ejs', { message: "Redirect Uri is misconfigured." , credentials : credentials });
        }
    } else {
        res.render('login.ejs', { message: "Client Id is invalid.Please check the configuration.", credentials : credentials });
    }
}

exports.appLogin = function (req, res) {
    let jwt = require('jsonwebtoken')
    let token = req.body.token;
    let version = req.body.version;
   
    let params = {
        'algorithms': ['RS256']
    }
    var base64Url = token.split('.')[1];
    var base64 = base64Url.replace('-', '+').replace('_', '/');
    var payload = JSON.parse(atob(base64));
    var baseUrl = payload.baseUrl
    var baseDomain = baseUrl.split('//')[1];

    console.log(" ******* payload ********", payload)
    console.log(" ******* baseDomain ********", baseDomain)
    var keyValue = version;

   
    console.log("***** version ******", version)

    let result = cache.get(keyValue)
    if (result) {
        try{
            console.log('Public key found and read successfully from interal cache :: ' + result);
            jwt.verify(token, result, params, function (err, decoded) {
                console.log("***** err ******", err);
                console.log("***** decoded ******", decoded);
                console.log("request.headers.host ********* ", req.headers.host)
                console.log("request.headers.protocol ********* ", req.protocol)
                res.render('dashboard.ejs')
                res.end();
            });
        } catch (e) {
            console.log("Issue Occurs while verifying the JWT Token.");
            console.log(e);
            getPartnerKeys(req, res, keyValue, token, baseDomain)
        }
    } else {
        console.log('******* Public Key not found. Going to do API call ******** ');
        getPartnerKeys(req, res, keyValue, token, baseDomain)
    }
}


function getPartnerKeys(req, res, keyValue, token, baseDomain){
    let jwt = require('jsonwebtoken')
    let params = {
        'algorithms': ['RS256']
    }
    const https = require('https');
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
                var result = JSON.parse(body);
                console.log("******* result *****", result);
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
                        jwt.verify(token, publicKey, params, function (err, decoded) {
                            console.log("***** err ******", err);
                            console.log("***** decoded ******", decoded);
                            console.log("request.headers.host ********* ", req.headers.host)
                            console.log("request.headers.protocol ********* ", req.protocol)

                            cache.put(keyValue, publicKey, 90000000, function (key, value) {
                                console.log(' Public key has setted into interal cache :: key : ' + key + ' Value :' + value);
                            });
                            let user = cache.get(keyValue)
                            if (user) {
                                console.log('Public key has readed successfully from interal cache :: ' + user);
                            } else {
                                console.log('Failed to read public key from interal cache :: ');
                            }
                            res.render('dashboard.ejs')
                            res.end();
                        });
                    } else {
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
                console.log('options::', options, 'body', body);
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
exports.dashboardPage = function (req, res) {
    res.render('dashboard.ejs')
    res.end();
}

exports.saveUser = function (req, res) {
    let email = req.body.email;
    let password = req.body.password;
    let cpassword = req.body.cpassword;
    let customer = req.body.customer;
    let user = userJsonProperties[email];
    let redirectUri = req.query.redirect_uri;
    let state = req.query.state;
    if (user != null) {
        res.render('signUp.ejs', { message: "User already exists. Try logging in." });
    } else {
        if (password == cpassword) {
            let userData = JSON.parse(fs.readFileSync('./conf/user.json'));
            console.log("**** user data *****", userData);
            userData[email] = {
                customer: customer,
                password: password
            }
            userData[email] = {
                customer: customer,
                password: password
            }
            fs.writeFileSync('./conf/user.json', JSON.stringify(userData));

            const uuidv4 = require('uuid/v4');
            var keyValue = uuidv4();
            keyValue = keyValue.replace(/-/g, "").toUpperCase();
            let newUser = {
                email: email,
                customer: customer
            }
            cache.put(keyValue, JSON.stringify(newUser), 1800000, function (key, value) {
                console.log(' Oauth code has setted into internal cache :: key : ' + key + ' Value :' + value);
            });
            let userFromCache = cache.get(keyValue)
            if (userFromCache) {
                console.log('Oauth code has readed successfully from internal cache :: ' + userFromCache);
            } else {
                console.log('Failed to read oauth code from internal cache :: ' + err);
            }
            res.writeHead(301, { Location: redirectUri + "?code=" + keyValue + "&state=" + state });
            res.end();
        } else {
            res.render('login.ejs', { message: "Password entered not matched.", credentials : null  })
        }
    }
}

exports.signUp = function (req, res) {
    console.log("********Going to Signup page**********");
    var customers = Object.keys(customerJsonProperties);
    console.log("****** customers *******", customers);
    res.render('signUp.ejs', { message: "", customers: customers });
}   
