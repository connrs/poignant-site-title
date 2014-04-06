var test = require('tape');
var clientSecret = 'MYSECRET';
var clientId = 'MYID';
var state = '1234567890';
var oauthMock = {
  OAuth2: function (client_id, client_secret, base_address, auth_path, token_path) {
    this.client_id = client_id;
    this.client_secret = client_secret;
    this.base_address = base_address;
    this.auth_path = auth_path;
    this.token_path = token_path;
  }
};
var idpGithub;

require.cache[require.resolve('oauth')] = {exports: oauthMock};
idpGithub = require('../');

test('Authorize URL', function (t) {
  oauthMock.OAuth2.prototype.getAuthorizeUrl = function (params) {
    t.deepEqual(params, {
      response_type: 'code',
      scope: "user:email"
    });
    return this.base_address + this.auth_path + '?client_secret=' + this.client_secret + '&client_id=' + this.client_id + '&response_type=' + params.response_type;
  };
  var idp = idpGithub({
    clientSecret: clientSecret,
    clientId: clientId
  });

  t.equal(idp.authUrl(), 'https://github.com/login/oauth/authorize?client_secret=MYSECRET&client_id=MYID&response_type=code');
  t.end();
});

test('Authorize URL with state', function (t) {
  var idp = idpGithub({
    clientSecret: clientSecret,
    clientId: clientId
  });

  oauthMock.OAuth2.prototype.get = function (url, token, callback) {
    callback(null, '{}');
  };

  oauthMock.OAuth2.prototype.getAuthorizeUrl = function (params) {
    t.equal(params.response_type, 'code');
    t.equal(params.state, state);
    t.end();
  };

  idp.authUrl({ state: state });
});

test('Identity returns access token', function (t) {
  var idp = idpGithub({
    clientSecret: clientSecret,
    clientId: clientId,
    redirectUri: 'http://example.com'
  });

  oauthMock.OAuth2.prototype.getOAuthAccessToken = function (token, params, callback) {
    t.equal(params.grant_type, 'code');
    t.equal(params.redirect_uri, 'http://example.com');
    callback(null, 'abcdefg', null, {
      access_token: 'zyx321',
      token_type: 'bearer'
    });
  };

  oauthMock.OAuth2.prototype.get = function (url, token, callback) {
    callback(null, '{}');
  };

  idp.identity('token', function (err, identity) {
    t.equal(identity.accessToken, 'abcdefg');
    t.equal(Object.prototype.toString.call(identity.profile), '[object Object]');
    t.end();
  });
});

test('Identity returns profile', function (t) {
  var idp = idpGithub({
    clientSecret: clientSecret,
    clientId: clientId,
    redirectUri: 'http://example.com'
  });

  oauthMock.OAuth2.prototype.getOAuthAccessToken = function (token, params, callback) {
    callback(null, 'zyx321', null, {
      access_token: 'zyx321',
      token_type: 'bearer'
    });
  };

  oauthMock.OAuth2.prototype.get = function (url, token, callback) {
    t.equal(url, 'https://api.github.com/user');
    callback(null, JSON.stringify({
      login: 'githubaccount',
      id: '1',
      name: 'Display Name',
      email: 'joe@bloggs.com',
      html_url: 'http://example.com/profileurl'
    }));
  };

  idp.identity('token', function (err, identity) {
    t.equal(identity.id, 'githubaccount');
    t.equal(identity.email, 'joe@bloggs.com');
    t.equal(identity.accessToken, 'zyx321');
    t.equal(identity.name, 'Display Name');
    t.equal(identity.url, 'http://example.com/profileurl');
    t.equal(Object.prototype.toString.call(identity.profile), '[object Object]');
    t.end();
  });
});
