var templateStream = require('app/stream/template-stream');
var formFilterStream = require('app/stream/form-filter-stream');
var addTo = require('barnacle-add-to');
var redirect = require('barnacle-redirect');
var redir = function (opts) {
  return redirect(opts.response);
}
var flashMessages = require('barnacle-flash-messages')(['flash_message']);
var hasPermission = require('../../lib/middleware/barnacles/has-permission');
var StreamActionController = require('app/controller/stream-action');
var ParseFormData = require('barnacle-parse-formdata');
var formData = function (opts) {
  return new ParseFormData(opts);
};


var User = require('../../lib/model/user.js');
var IdentityToken = require('../../lib/model/identity_token.js');
var HTTPError = require('http-errors');

function AuthController(options) {
  var authWith = this._createActionStream('authWith');
  var google = this._createActionStream('google');
  var github = this._createActionStream('github');
  var facebook = this._createActionStream('facebook');
  var persona = this._createActionStream('persona');
  var logout = this._createActionStream('logout');
  var sess = function (opts) {
    return options.session(opts.request, opts.response);
  };
  var addNav = function () {
    return addTo('navigation', options.navigation);
  };
  var addConfig = function () {
    return addTo('config', options.config);
  };

  StreamActionController.apply(this, arguments);
  this._routes = [
    ['all', '/auth/with_:idp', [
      formData,
      sess,
      redir,
      flashMessages,
      addNav,
      addConfig,
      authWith
    ]],
    ['head', '/auth/with_:idp', [
      formData,
      sess,
      redir,
      authWith
    ]],
    ['all', '/auth/google(\\?.*)?', [
      formData,
      sess,
      redir,
      flashMessages,
      addNav,
      addConfig,
      google
    ]],
    ['head', '/auth/google(\\?.*)?', [
      formData,
      sess,
      redir,
      flashMessages,
      addNav,
      addConfig,
      google
    ]],
    ['all', '/auth/github(\\?.*)?', [
      formData,
      sess,
      redir,
      flashMessages,
      addNav,
      addConfig,
      github
    ]],
    ['head', '/auth/github(\\?.*)?', [
      formData,
      sess,
      redir,
      flashMessages,
      addNav,
      addConfig,
      github
    ]],
    ['all', '/auth/facebook(\\?.*)?', [
      formData,
      sess,
      redir,
      flashMessages,
      addNav,
      addConfig,
      facebook
    ]],
    ['head', '/auth/facebook(\\?.*)?', [
      formData,
      sess,
      redir,
      flashMessages,
      addNav,
      addConfig,
      facebook
    ]],
    ['all', '/auth/persona(\\?.*)?', [
      formData,
      sess,
      redir,
      flashMessages,
      addNav,
      addConfig,
      persona
    ]],
    ['head', '/auth/persona(\\?.*)?', [
      formData,
      sess,
      redir,
      flashMessages,
      addNav,
      addConfig,
      persona
    ]],
    ['get', '/auth/logout', [
      formData,
      sess,
      redir,
      flashMessages,
      addNav,
      addConfig,
      logout
    ]]
  ];
}

AuthController.prototype = Object.create(StreamActionController.prototype, { constructor: AuthController });

AuthController.prototype.setIDP = function (idp) {
  this._idp = idp;
}

AuthController.prototype.setStore = function (store) {
  this._store = store;
};

AuthController.prototype.authWith = function (obj, done) {
  var params = {
    state: obj.session.uid()
  };

  if (obj.params.idp.toLowerCase() === 'google') {
    params.scope = [ 'https://www.googleapis.com/auth/plus.login' ];
    params.access_type = 'offline';
    params.request_visible_actions = 'http://schemas.google.com/AddActivity http://schemas.google.com/CommentActivity https://schemas.google.com/CreateActivity';
  }

  if (!obj.params.idp || !this._idp[obj.params.idp.toLowerCase()]) {
    done(new HTTPError.InternalServerError());
  }
  else {
    obj.redirect(this._idp[obj.params.idp.toLowerCase()]().authUrl(params), 302);
  }
};

AuthController.prototype.google = function (obj, done) {
  if (obj.data.state !== obj.session.uid()) {
    done(new HTTPError.NotFoundError());
  }
  else {
    this._idp.google().identity(obj.data.code, function (err, identity) {
      if (err) {
        done(err);
      }
      else {
        this._user().findByIdentity(identity.id, 1, function (err, userData) {
          if (err) {
            done(err);
          }
          else if (!userData) {
            obj.session.set('account_new', { identity: identity, provider_id: 1, primary_identity: true }, function (err) {
              obj.redirect('/account/new', 302);
            });
          }
          else {
            obj.session.set('user_id', userData.user_id, function (err) {
              var user = this._user();
              var idToken = this._identityToken();
              user.setData({
                software_version_id: obj.config.softwareVersion,
                user_id: userData.user_id,
                date: new Date()
              });
              if (identity.refreshToken) {
                idToken.setData({
                  identity_id: userData.identity_id,
                  identity_token_type_id: 2,
                  token: identity.refreshToken,
                  user_id: userData.user_id
                });
                idToken.save(function (err) {
                  if (err) console.error(err);
                });
              }
              user.updateLastLogin(function (err) {
                obj.redirect('/', 302);
              });
            }.bind(this));
          }
        }.bind(this));
      }
    }.bind(this));
  }
}

AuthController.prototype.github = function (obj, done) {
  if (obj.data.state !== obj.session.uid()) {
    done(new HTTPError.BadRequestError());
  }
  else {
    this._idp.github().identity(obj.data.code, function (err, identity) {
      if (err) {
        done(err);
      }
      else {
        this._user().findByIdentity(identity.id, 2, function (err, userData) {
          if (err) {
            done(err);
          }
          else if (!userData) {
            obj.session.set('account_new', { identity: identity, provider_id: 2, primary_identity: true }, function (err) {
              obj.redirect('/account/new', 302);
            });
          }
          else {
            obj.session.set('user_id', userData.user_id, function (err) {
              var user = this._user();
              user.setData({
                software_version_id: obj.config.softwareVersion,
                user_id: userData.user_id,
                date: new Date()
              });
              user.updateLastLogin(function (err) {
                obj.redirect('/', 302);
              });
            }.bind(this));
          }
        }.bind(this));
      }
    }.bind(this));
  }
};

AuthController.prototype.facebook = function (obj, done) {
  if (obj.data.state !== obj.session.uid()) {
    done(new HTTPError.BadRequestError());
  }
  else {
    this._idp.facebook().identity(obj.data.code, function (err, identity) {
      if (err) {
        done(err);
      }
      else {
        this._user().findByIdentity(identity.id, 3, function (err, userData) {
          if (err) {
            done(err);
          }
          else if (!userData) {
            obj.session.set('account_new', { identity: identity, provider_id: 3, primary_identity: true }, function (err) {
              obj.redirect('/account/new', 302);
            });
          }
          else {
            obj.session.set('user_id', userData.user_id, function (err) {
              var user = this._user();
              user.setData({
                software_version_id: obj.config.softwareVersion,
                user_id: userData.user_id,
                date: new Date()
              });
              user.updateLastLogin(function (err) {
                obj.redirect('/', 302);
              });
            }.bind(this));
          }
        }.bind(this));
      }
    }.bind(this));
  }
};

AuthController.prototype.persona = function (obj, done) {
  this._idp.persona().identity(obj.data.assertion, function (err, identity) {
    if (err) {
      done(err);
    }
    else {
      this._user().findByIdentity(identity.id, 4, function (err, userData) {
        if (err) {
          done(err);
        }
        else if (!userData) {
          obj.session.set('account_new', { identity: identity, provider_id: 4, primary_identity: true }, function (err) {
            obj.headers = {
              'content-type': 'application/json; charset=UTF-8'
            };
            obj.output = JSON.stringify('/account/new');
            done(null, obj);
          });
        }
        else {
          obj.session.set('user_id', userData.user_id, function (err) {
            var user = this._user();
            user.setData({
              software_version_id: obj.config.softwareVersion,
              user_id: userData.user_id,
              date: new Date()
            });
            user.updateLastLogin(function (err) {
              obj.headers = {
                'content-type': 'application/json; charset=UTF-8'
              };
              obj.output = JSON.stringify('/');
              done(null, obj);
            });
          }.bind(this));
        }
      }.bind(this));
    }
  }.bind(this));
};

AuthController.prototype.logout = function (obj, done) {
  obj.session.remove(function (err) {
    obj.redirect('/', 302);
  });
};

AuthController.prototype._user = function () {
  return new User(this._store.user);
}

AuthController.prototype._identityToken = function () {
  return new IdentityToken(this._store.identityToken);
};

function newAuthController(opts, idp, store) {
  var controller = new AuthController(opts);
  controller.setIDP(idp);
  controller.setStore(store);
  return controller;
}

module.exports = newAuthController;
