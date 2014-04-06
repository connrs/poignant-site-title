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
var idpGoogle;

require.cache[require.resolve('oauth')] = {exports: oauthMock};
idpGoogle = require('../');

test('Authorize URL', function (t) {
  oauthMock.OAuth2.prototype.getAuthorizeUrl = function (params) {
    t.deepEqual(params, {
      response_type: 'code',
      scope: "email"
    });
    return this.base_address + '?client_secret=' + this.client_secret + '&client_id=' + this.client_id + '&response_type=' + params.response_type;
  };
  var idp = idpGoogle({
    clientSecret: clientSecret,
    clientId: clientId
  });

  t.equal(idp.authUrl(), 'https://accounts.google.com/o/oauth2?client_secret=MYSECRET&client_id=MYID&response_type=code');
  t.end();
});

test('Authorize URL with state', function (t) {
  var idp = idpGoogle({
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

test('Identity returns id and access token', function (t) {
  var idp = idpGoogle({
    clientSecret: clientSecret,
    clientId: clientId,
    redirectUri: 'http://example.com',
    state: state
  });

  oauthMock.OAuth2.prototype.getOAuthAccessToken = function (token, params, callback) {
    t.equal(params.grant_type, 'authorization_code');
    t.equal(params.redirect_uri, 'http://example.com');
    callback(null, 'abcdefg', null, {
      access_token: 'abcdefg',
      expires_in: 3600,
      id_token: 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjIyNTlmYjk5ODRmMTNlM2Q3MTM5MjdhOWI2MjY4ZTBjNTkyNTk5MWYifQ.eyJpc3MiOiJhY2NvdW50cy5nb29nbGUuY29tIiwiYXVkIjoiNDA3NDA4NzE4MTkyLmFwcHMuZ29vZ2xldXNlcmNvbnRlbnQuY29tIiwiY2lkIjoiNDA3NDA4NzE4MTkyLmFwcHMuZ29vZ2xldXNlcmNvbnRlbnQuY29tIiwiYXpwIjoiNDA3NDA4NzE4MTkyLmFwcHMuZ29vZ2xldXNlcmNvbnRlbnQuY29tIiwidG9rZW5faGFzaCI6InB1VGw4WE5CVWVOZGhSbDZUZEtSVUEiLCJhdF9oYXNoIjoicHVUbDhYTkJVZU5kaFJsNlRkS1JVQSIsImlkIjoiMTA0OTg0NTE5OTUwMzA4NjAwOTE1Iiwic3ViIjoiMTA0OTg0NTE5OTUwMzA4NjAwOTE1IiwiaWF0IjoxMzc1NjQ5MDQyLCJleHAiOjEzNzU2NTI5NDJ9.B-vzQwt55BU1NJcKIETh551OAYWzj6JlOoaptzF-be2jpOjtoY11iG2lYTu3jTJ45TIfYyeXF737YBYYragT0WqJadwMgHEmalAFAWsPy_MQ2M1_CdasT2pd5C8OQwbR4KKC3O4Kh-B7tDEfzRUx8xDwgVjT90VVfNmOEUeqWtU'
    });
  };

  oauthMock.OAuth2.prototype.get = function (url, token, callback) {
    callback(null, '{}');
  };

  idp.identity('token', function (err, identity) {
    t.equal(identity.id, '104984519950308600915');
    t.equal(identity.accessToken, 'abcdefg');
    t.equal(Object.prototype.toString.call(identity.profile), '[object Object]');
    t.end();
  });
});

test('Identity returns profile', function (t) {
  var idp = idpGoogle({
    clientSecret: clientSecret,
    clientId: clientId,
    redirectUri: 'http://example.com',
    state: state
  });

  oauthMock.OAuth2.prototype.getOAuthAccessToken = function (token, params, callback) {
    callback(null, 'abcdefg', null, {
      access_token: 'abcdefg',
      expires_in: 3600,
      id_token: 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjIyNTlmYjk5ODRmMTNlM2Q3MTM5MjdhOWI2MjY4ZTBjNTkyNTk5MWYifQ.eyJpc3MiOiJhY2NvdW50cy5nb29nbGUuY29tIiwiYXVkIjoiNDA3NDA4NzE4MTkyLmFwcHMuZ29vZ2xldXNlcmNvbnRlbnQuY29tIiwiY2lkIjoiNDA3NDA4NzE4MTkyLmFwcHMuZ29vZ2xldXNlcmNvbnRlbnQuY29tIiwiYXpwIjoiNDA3NDA4NzE4MTkyLmFwcHMuZ29vZ2xldXNlcmNvbnRlbnQuY29tIiwidG9rZW5faGFzaCI6InB1VGw4WE5CVWVOZGhSbDZUZEtSVUEiLCJhdF9oYXNoIjoicHVUbDhYTkJVZU5kaFJsNlRkS1JVQSIsImlkIjoiMTA0OTg0NTE5OTUwMzA4NjAwOTE1Iiwic3ViIjoiMTA0OTg0NTE5OTUwMzA4NjAwOTE1IiwiaWF0IjoxMzc1NjQ5MDQyLCJleHAiOjEzNzU2NTI5NDJ9.B-vzQwt55BU1NJcKIETh551OAYWzj6JlOoaptzF-be2jpOjtoY11iG2lYTu3jTJ45TIfYyeXF737YBYYragT0WqJadwMgHEmalAFAWsPy_MQ2M1_CdasT2pd5C8OQwbR4KKC3O4Kh-B7tDEfzRUx8xDwgVjT90VVfNmOEUeqWtU'
    });
  };

  oauthMock.OAuth2.prototype.get = function (url, token, callback) {
    t.equal(url, 'https://www.googleapis.com/plus/v1/people/me');
    callback(null, JSON.stringify({
      id: '104984519950308600915',
      displayName: 'Display Name',
      emails: [
        { value: 'joe@bloggs.com', primary: true },
        { value: 'nope@example.com', primary: false }
      ],
      url: 'http://example.com/profileurl'
    }));
  };

  idp.identity('token', function (err, identity) {
    t.equal(identity.id, '104984519950308600915');
    t.equal(identity.email, 'joe@bloggs.com');
    t.equal(identity.accessToken, 'abcdefg');
    t.equal(identity.name, 'Display Name');
    t.equal(identity.url, 'http://example.com/profileurl');
    t.equal(Object.prototype.toString.call(identity.profile), '[object Object]');
    t.end();
  });
});

test('Refresh identity', function (t) {
  var idp = idpGoogle({
    clientSecret: clientSecret,
    clientId: clientId
  });

  oauthMock.OAuth2.prototype.getOAuthAccessToken = function (token, params, callback) {
    t.equal(params.grant_type, 'refresh_token');
    t.equal(token, 'the_refresh_token');
    callback(null, 'abcdefg', null, {
      access_token: 'abcdefg',
      expires_in: 3600,
      id_token: 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjIyNTlmYjk5ODRmMTNlM2Q3MTM5MjdhOWI2MjY4ZTBjNTkyNTk5MWYifQ.eyJpc3MiOiJhY2NvdW50cy5nb29nbGUuY29tIiwiYXVkIjoiNDA3NDA4NzE4MTkyLmFwcHMuZ29vZ2xldXNlcmNvbnRlbnQuY29tIiwiY2lkIjoiNDA3NDA4NzE4MTkyLmFwcHMuZ29vZ2xldXNlcmNvbnRlbnQuY29tIiwiYXpwIjoiNDA3NDA4NzE4MTkyLmFwcHMuZ29vZ2xldXNlcmNvbnRlbnQuY29tIiwidG9rZW5faGFzaCI6InB1VGw4WE5CVWVOZGhSbDZUZEtSVUEiLCJhdF9oYXNoIjoicHVUbDhYTkJVZU5kaFJsNlRkS1JVQSIsImlkIjoiMTA0OTg0NTE5OTUwMzA4NjAwOTE1Iiwic3ViIjoiMTA0OTg0NTE5OTUwMzA4NjAwOTE1IiwiaWF0IjoxMzc1NjQ5MDQyLCJleHAiOjEzNzU2NTI5NDJ9.B-vzQwt55BU1NJcKIETh551OAYWzj6JlOoaptzF-be2jpOjtoY11iG2lYTu3jTJ45TIfYyeXF737YBYYragT0WqJadwMgHEmalAFAWsPy_MQ2M1_CdasT2pd5C8OQwbR4KKC3O4Kh-B7tDEfzRUx8xDwgVjT90VVfNmOEUeqWtU'
    });
  };

  oauthMock.OAuth2.prototype.get = function (url, token, callback) {
    callback(null, '{}');
  };

  idp.refresh('the_refresh_token', function (err, identity) {
    t.equal(identity.id, '104984519950308600915');
    t.equal(identity.accessToken, 'abcdefg');
    t.equal(Object.prototype.toString.call(identity.profile), '[object Object]');
    t.end();
  });
});
