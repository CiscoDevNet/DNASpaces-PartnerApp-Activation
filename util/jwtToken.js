let jwt = require('jsonwebtoken'),
  fs = require('file-system'),
  properties = require('../conf/oauth-properties.json');

module.exports = {
  generateJwtToken: function (payload) {
    let encodeKey = properties.jwt.encodeKey;
    let privateKeyPath = properties.jwt.privateKeyPath;
    privateKeyPath = appRoot.concat(privateKeyPath);
    let cert = fs.readFileSync(privateKeyPath);
    //issued before 30 mins
    let issuedAt = Math.floor(Date.now() / 1000) - parseInt(properties.jwt.issuedAt);
    //let expiresIn = Math.floor(Date.now() / 1000) + parseInt(properties.jwt.expiry);
    if (!payload) {
      payload = {};
    }
    payload['iat'] = issuedAt;
    payload['original_iat'] = payload['original_iat'] ? payload['original_iat'] : issuedAt;
    //payload['exp'] = expiresIn;
    let key = {
      'key': cert,
      'passphrase': encodeKey
    };
    let algo = {
      'algorithm': 'RS256'
    };
    console.log("***** token payload ******",payload);
    let token = jwt.sign(payload, key, algo);
    // console.log('token generated', token);
    return token;
  },

  decodeToken: function (token, cb) {
    let jwt = require('jsonwebtoken');
    let fs = require('file-system');
    // let encodeKey = properties.get('passcodes.jwtToken.encodeKey');
    let privateKeyPath = properties.jwt.publicKeyPath;
    privateKeyPath = appRoot.concat(privateKeyPath);
    let cert = fs.readFileSync(privateKeyPath);
    let params = {
      'algorithms': ['RS256'],
      'ignoreExpiration': true
    }
    jwt.verify(token, cert, params, function (err, decoded) {
      // console.log(decoded) // {foo:bar}
      cb(decoded);
    });
  },

  verifyToken: function (token, cb) {
    let jwt = require('jsonwebtoken');
    let fs = require('file-system');
    // let encodeKey = properties.get('passcodes.jwtToken.encodeKey');
    let privateKeyPath = properties.jwt.publicKeyPath;
    privateKeyPath = appRoot.concat(privateKeyPath);
    let cert = fs.readFileSync(privateKeyPath);
    let params = {
      'algorithms': ['RS256']
    }
    return jwt.verify(token, cert, params);
  }
}
