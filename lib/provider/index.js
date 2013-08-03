var xtend = require('xtend');
var jwt = require('jwt-simple');
var OAuth2 = require('oauth').OAuth2;

function Provider() {}

Provider.prototype.setOAuthCredentials = function (creds) {
    this._clientId = creds.client_id;
    this._clientSecret = creds.client_secret;
    this._baseAddress = creds.base_address;
    this._authBaseAddress = creds.auth_base_address;
    this._authorizePath = creds.authorize_path;
    this._tokenBaseAddress = creds.token_base_address;
    this._tokenPath = creds.token_path;
    this._profilePath = creds.profile_path;
    this._providerId = creds.provider_id;
    this._profileUrlTemplate = creds.profile_url_template;
};

Provider.prototype.providerId = function () {
  return this._providerId;
};

Provider.prototype.profileUrlTemplate = function () {
  return this._profileUrlTemplate;
};

Provider.prototype.setAuthParameters = function (parameters) {
    this._authParameters = parameters;
};

Provider.prototype.setTokenParameters = function (parameters) {
    this._tokenParameters = parameters;
};

Provider.prototype.setUserData = function (userData) {
    this._userData = userData;
}

Provider.prototype.getAuthorizeUrl = function (extraParameters) {
    return this._newOAuth2(this._authBaseAddress).getAuthorizeUrl(xtend(this._authParameters, extraParameters));
};

Provider.prototype.getProviderUser = function (token, callback) {
    this._newOAuth2(this._tokenBaseAddress).getOAuthAccessToken(token, this._tokenParameters, this._accessTokenToProviderUserPayload.bind(this, callback));
};

Provider.prototype.getProfile = function (token, callback) {
  this._newOAuth2(this._tokenBaseAddress).getOAuthAccessToken(token, this._tokenParameters, function (err, accessToken, refreshToken, results) {
    if (err) {
      callback(err);
    }
    else if (!accessToken) {
      callback(new Error('No access token returned'));
    }
    else {
      this._newOAuth2().get(this._baseAddress + this._profilePath, accessToken, function (err, result, response) {
        if (err) {
          callback(err);
        }
        else {
          try {
            callback(null, JSON.parse(result));
          }
          catch(e) {
            callback(e);
          }
        }
      });
    }
  }.bind(this));
};
Provider.prototype._accessTokenToProviderUserPayload = function (callback, err, accessToken, refreshToken, results) {
    if (err) {
        callback(err);
        return;
    }

    var data = jwt.decode(results.id_token, null, true);
    var payload = {
        uid: data.sub,
        email: data.email
    };

    this._userData.findByProviderUid(payload.uid, this._appendUserDataToProviderUserPayload.bind(this, payload, callback));
};

Provider.prototype._appendUserDataToProviderUserPayload = function (payload, callback, err, userData) {
    var providerUser = { payload: payload };

    if (err) {
        callback(err);
    }

    if (userData !== null) {
        providerUser.userData = userData;
    }

    callback(null, providerUser);
};

Provider.prototype._newOAuth2 = function (baseAddress) {
  if (baseAddress === undefined) {
    baseAddress = this._baseAddress;
  }

  return new OAuth2(this._clientId, this._clientSecret, baseAddress, this._authorizePath, this._tokenPath);
};

function newProvider(userData, creds, auth, token) {
    var provider = new Provider();

    provider.setUserData(userData);
    provider.setOAuthCredentials(creds);
    provider.setAuthParameters(auth);
    provider.setTokenParameters(token);

    return provider;
}

module.exports = newProvider;
