var oauth2 = require('oauth').OAuth2;
var xtend = require('xtend');
var AUTH = {
  baseAddress: 'https://www.facebook.com',
  path: '/dialog/oauth',
  params: {
    response_type: 'code'
  },
  scope: [
    'email'
  ]
};
var TOKEN = {
  baseAddress: 'https://graph.facebook.com',
  path: '/oauth/access_token',
  params: {
    grant_type: 'code'
  }
};
var API = {
  baseAddress: 'https://graph.facebook.com'
};

function IDPFacebook() {
  this._identityCallback = null;
  this._identity = {};
}

IDPFacebook.prototype.setClientId = function (clientId) {
  this._clientId = clientId;
};

IDPFacebook.prototype.setClientSecret = function (clientSecret) {
  this._clientSecret = clientSecret;
};

IDPFacebook.prototype.setState = function (state) {
  this._state = state;
};

IDPFacebook.prototype.setRedirectUri = function (redirectUri) {
  this._redirectUri = redirectUri;
};

IDPFacebook.prototype.authUrl = function (params) {
  return this._newOAuth2(AUTH.baseAddress).getAuthorizeUrl(this._authParams(params));
};

IDPFacebook.prototype.identity = function (token, callback) {
  this._identityCallback = callback;
  this._newOAuth2(TOKEN.baseAddress).getOAuthAccessToken(token, this._tokenParams(), this._onGetOAuthAccessToken.bind(this));
};

IDPFacebook.prototype.get = function (url, accessToken, callback) {
  this._newOAuth2(API.baseAddress).get(API.baseAddress + url, accessToken, callback);
};

IDPFacebook.prototype._newOAuth2 = function (baseAddress) {
  return new oauth2(this._clientId, this._clientSecret, baseAddress, AUTH.path, TOKEN.path);
};

IDPFacebook.prototype._authParams = function (params) {
  var authParams = xtend(AUTH.params, {});

  if (this._redirectUri) {
    authParams.redirect_uri = this._redirectUri;
  }

  if (AUTH.scope.length) {
    authParams.scope = AUTH.scope.join(',');
  }

  return xtend(authParams, params);
};

IDPFacebook.prototype._tokenParams = function () {
  var tokenParams = xtend(TOKEN.params, {});

  if (this._redirectUri) {
    tokenParams.redirect_uri = this._redirectUri;
  }

  return tokenParams;
};

IDPFacebook.prototype._onGetOAuthAccessToken = function (err, accessToken, refreshToken, response) {
  if (err) {
    this._identityCallback(err);
  }
  else {
    this._accessToken = accessToken;
    this._refreshToken = refreshToken;
    this._extendIdentityWithAccessTokenResponse();
    this._getProfileWithIdentity();
  }
};

IDPFacebook.prototype._extendIdentityWithAccessTokenResponse = function () {
  this._identity.accessToken = this._accessToken;
  this._identity.refreshToken = this._refreshToken;
};

IDPFacebook.prototype._getProfileWithIdentity = function () {
  this.get('/me', this._identity.accessToken, this._onGetProfileWithIdentity.bind(this));
};

IDPFacebook.prototype._onGetProfileWithIdentity = function (err, response) {
  if (err) {
    this._identityCallback(err);
  }
  else {
    try {
      var response = JSON.parse(response);

      this._identity.id = response.id;
      this._identity.name = response.name;
      this._identityCallback(null, xtend(this._identity, {
        url: response.link,
        email: response.email,
        profile: response
      }));
    }
    catch (e) {
      this._identityCallback(e);
    }
  }
};

function idpFacebook(options) {
  var idp = new IDPFacebook();

  idp.setClientId(options.clientId);
  idp.setClientSecret(options.clientSecret);

  if (options.redirectUri) {
    idp.setRedirectUri(options.redirectUri);
  }

  return idp;
}

idpFacebook.IDPFacebook = IDPFacebook;

module.exports = idpFacebook;
