var oauth2 = require('oauth').OAuth2;
var jwt = require('jwt-simple');
var xtend = require('xtend');
var AUTH = {
  baseAddress: 'https://accounts.google.com/o/oauth2',
  path: '/auth',
  params: {
    response_type: 'code'
  },
  scope: [
    'email'
  ]
};
var TOKEN = {
  baseAddress: 'https://accounts.google.com/o/oauth2',
  path: '/token',
  params: {
    grant_type: 'authorization_code'
  }
};
var API = {
  baseAddress: 'https://www.googleapis.com'
};

function IDPGoogle() {
  this._identityCallback = null;
  this._identity = {};
}

IDPGoogle.prototype.setClientId = function (clientId) {
  this._clientId = clientId;
};

IDPGoogle.prototype.setClientSecret = function (clientSecret) {
  this._clientSecret = clientSecret;
};

IDPGoogle.prototype.setState = function (state) {
  this._state = state;
};

IDPGoogle.prototype.setRedirectUri = function (redirectUri) {
  this._redirectUri = redirectUri;
};

IDPGoogle.prototype.authUrl = function (params) {
  return this._newOAuth2(AUTH.baseAddress).getAuthorizeUrl(this._authParams(params));
};

IDPGoogle.prototype.identity = function (token, callback) {
  this._identityCallback = callback;
  this._newOAuth2(TOKEN.baseAddress).getOAuthAccessToken(token, this._tokenParams(), this._onGetOAuthAccessToken.bind(this));
};

IDPGoogle.prototype.refresh = function (token, callback) {
  this._identityCallback = callback;
  this._newOAuth2(TOKEN.baseAddress).getOAuthAccessToken(token, this._refreshTokenParams(), this._onGetOAuthAccessToken.bind(this));
};

IDPGoogle.prototype.get = function (url, accessToken, callback) {
  this._newOAuth2(API.baseAddress).get(API.baseAddress + url, accessToken, callback);
};

IDPGoogle.prototype._newOAuth2 = function (baseAddress) {
  return new oauth2(this._clientId, this._clientSecret, baseAddress, AUTH.path, TOKEN.path);
};

IDPGoogle.prototype._authParams = function (params) {
  var authParams = xtend(AUTH.params, {});

  if (this._redirectUri) {
    authParams.redirect_uri = this._redirectUri;
  }

  if (AUTH.scope.length) {
    authParams.scope = AUTH.scope.join(' ');
  }

  return xtend(authParams, params);
};

IDPGoogle.prototype._tokenParams = function () {
  var tokenParams = xtend(TOKEN.params, {});

  if (this._redirectUri) {
    tokenParams.redirect_uri = this._redirectUri;
  }

  return tokenParams;
};

IDPGoogle.prototype._refreshTokenParams = function () {
  var tokenParams = xtend(TOKEN.params, { grant_type: 'refresh_token' });

  return tokenParams;
};

IDPGoogle.prototype._onGetOAuthAccessToken = function (err, accessToken, refreshToken, response) {
  if (err) {
    this._identityCallback(err);
  }
  else {
    this._accessToken = accessToken;
    this._refreshToken = refreshToken;
    this._accessTokenResponse = jwt.decode(response.id_token, null, true);
    this._extendIdentityWithAccessTokenResponse();
    this._getProfileWithIdentity();
  }
};

IDPGoogle.prototype._extendIdentityWithAccessTokenResponse = function () {
  this._identity.id = this._accessTokenResponse.sub;
  this._identity.accessToken = this._accessToken;
  this._identity.refreshToken = this._refreshToken;
};

IDPGoogle.prototype._getProfileWithIdentity = function () {
  this.get('/plus/v1/people/me', this._identity.accessToken, this._onGetProfileWithIdentity.bind(this));
};

IDPGoogle.prototype._onGetProfileWithIdentity = function (err, response) {
  if (err) {
    this._identityCallback(err);
  }
  else {
    try {
      var response = JSON.parse(response);

      if (response.emails && response.emails.length) {
        this._identity.email = response.emails.filter(function (e) { return e.primary; }).reduce(function (k,v) { return v.value }, '');
      }

      this._identity.name = response.displayName;
      this._identityCallback(null, xtend(this._identity, {
        url: response.url,
        profile: response
      }));
    }
    catch (e) {
      this._identityCallback(e);
    }
  }
};

function idpGoogle(options) {
  var idp = new IDPGoogle();

  idp.setClientId(options.clientId);
  idp.setClientSecret(options.clientSecret);

  if (options.redirectUri) {
    idp.setRedirectUri(options.redirectUri);
  }

  return idp;
}

idpGoogle.IDPGoogle = IDPGoogle;

module.exports = idpGoogle;
