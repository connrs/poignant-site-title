var barnacleMode = require('barnacle-mode');
var Controller = require('./core');
var User = require('../../lib/model/user.js');
var IdentityToken = require('../../lib/model/identity_token.js');
var HTTPError = require('http-errors');

function AuthController() {
  var authWith = barnacleMode(this.authWith.bind(this));
  var google = barnacleMode(this.google.bind(this));
  var github = barnacleMode(this.github.bind(this));
  var facebook = barnacleMode(this.facebook.bind(this));
  var persona = barnacleMode(this.persona.bind(this));
  var logout = barnacleMode(this.logout.bind(this));

  Controller.apply(this, arguments);
  this._routes = [
    ['all', '/auth/with_:idp', {
      action: authWith
    }],
    ['head', '/auth/with_:idp', {
      action: authWith
    }],
    ['all', '/auth/google(\\?.*)?', {
      action: google
    }],
    ['head', '/auth/google(\\?.*)?', {
      action: google
    }],
    ['all', '/auth/github(\\?.*)?', {
      action: github
    }],
    ['head', '/auth/github(\\?.*)?', {
      action: github
    }],
    ['all', '/auth/facebook(\\?.*)?', {
      action: facebook
    }],
    ['head', '/auth/facebook(\\?.*)?', {
      action: facebook
    }],
    ['all', '/auth/persona(\\?.*)?', {
      action: persona
    }],
    ['head', '/auth/persona(\\?.*)?', {
      action: persona
    }],
    ['get', '/auth/logout', {
      action: logout
    }]
  ];
}

AuthController.prototype = Object.create(Controller.prototype, { constructor: AuthController });

AuthController.prototype.setIDP = function (idp) {
  this._idp = idp;
}

AuthController.prototype.setStore = function (store) {
  this._store = store;
};

AuthController.prototype.index = function (obj, done) {
  var template = this._template(obj, 'default');
  obj.output = template('auth_index', {
    page: { title: 'Sign in' }
  });
  done(null, obj);
};

AuthController.prototype.authWith = function (obj, done) {
  var template = this._template(obj, 'default');
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
            obj.session.set('current_user_id', userData.user_id, function (err) {
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
            obj.session.set('current_user_id', userData.user_id, function (err) {
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
            obj.session.set('current_user_id', userData.user_id, function (err) {
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
          obj.session.set('current_user_id', userData.user_id, function (err) {
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

function newAuthController(idp, store) {
  var controller = new AuthController();
  controller.setIDP(idp);
  controller.setStore(store);
  return controller;
}

module.exports = newAuthController;
