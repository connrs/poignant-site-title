var oauth2 = require('oauth').OAuth2;
var xtend = require('xtend');
var AUTH = {
  baseAddress: 'https://github.com',
  path: '/login/oauth/authorize',
  params: {
    response_type: 'code'
  },
  scope: [
    'user:email'
  ]
};
var TOKEN = {
  baseAddress: 'https://github.com',
  path: '/login/oauth/access_token',
  params: {
    grant_type: 'code'
  }
};
var API = {
  baseAddress: 'https://api.github.com'
};

function IDPGithub() {
  this._identityCallback = null;
  this._identity = {};
}

IDPGithub.prototype.setClientId = function (clientId) {
  this._clientId = clientId;
};

IDPGithub.prototype.setClientSecret = function (clientSecret) {
  this._clientSecret = clientSecret;
};

IDPGithub.prototype.setState = function (state) {
  this._state = state;
};

IDPGithub.prototype.setRedirectUri = function (redirectUri) {
  this._redirectUri = redirectUri;
};

IDPGithub.prototype.authUrl = function (params) {
  return this._newOAuth2(AUTH.baseAddress).getAuthorizeUrl(this._authParams(params));
};

IDPGithub.prototype.identity = function (token, callback) {
  this._identityCallback = callback;
  this._newOAuth2(TOKEN.baseAddress).getOAuthAccessToken(token, this._tokenParams(), this._onGetOAuthAccessToken.bind(this));
};

IDPGithub.prototype.get = function (url, accessToken, callback) {
  this._newOAuth2(API.baseAddress).get(API.baseAddress + url, accessToken, callback);
};

IDPGithub.prototype._newOAuth2 = function (baseAddress) {
  return new oauth2(this._clientId, this._clientSecret, baseAddress, AUTH.path, TOKEN.path);
};

IDPGithub.prototype._authParams = function (params) {
  var authParams = xtend(AUTH.params, {});

  if (this._redirectUri) {
    authParams.redirect_uri = this._redirectUri;
  }

  if (AUTH.scope.length) {
    authParams.scope = AUTH.scope.join(' ');
  }

  return xtend(authParams, params);
};

IDPGithub.prototype._tokenParams = function () {
  var tokenParams = xtend(TOKEN.params, {});

  if (this._redirectUri) {
    tokenParams.redirect_uri = this._redirectUri;
  }

  return tokenParams;
};

IDPGithub.prototype._onGetOAuthAccessToken = function (err, accessToken, refreshToken, response) {
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

IDPGithub.prototype._extendIdentityWithAccessTokenResponse = function () {
  this._identity.accessToken = this._accessToken;
  this._identity.refreshToken = this._refreshToken;
};

IDPGithub.prototype._getProfileWithIdentity = function () {
  this.get('/user', this._identity.accessToken, this._onGetProfileWithIdentity.bind(this));
};

IDPGithub.prototype._onGetProfileWithIdentity = function (err, response) {
  if (err) {
    this._identityCallback(err);
  }
  else {
    try {
      var response = JSON.parse(response);

      this._identity.id = response.login;
      this._identity.name = response.name;
      this._identityCallback(null, xtend(this._identity, {
        url: response.html_url,
        email: response.email,
        profile: response
      }));
    }
    catch (e) {
      this._identityCallback(e);
    }
  }
};

function idpGithub(options) {
  var idp = new IDPGithub();

  idp.setClientId(options.clientId);
  idp.setClientSecret(options.clientSecret);

  if (options.redirectUri) {
    idp.setRedirectUri(options.redirectUri);
  }

  return idp;
}

idpGithub.IDPGithub = IDPGithub;

module.exports = idpGithub;
