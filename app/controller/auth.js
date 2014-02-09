var Controller = require('./core');
var User = require('../../lib/model/user.js');
var IdentityToken = require('../../lib/model/identity_token.js');
var boundMethods = [
  'index',
  'authWith',
  'google',
  'github',
  'facebook',
  'persona'
];

function AuthController() {
  Controller.apply(this, arguments);
  this._routes = [
    ['all', '/auth/with_:idp', this.authWith.bind(this)],
    ['head', '/auth/with_:idp', this.authWith.bind(this)],
    ['all', '/auth/google(\\?.*)?', this.google.bind(this)],
    ['head', '/auth/google(\\?.*)?', this.google.bind(this)],
    ['all', '/auth/github(\\?.*)?', this.github.bind(this)],
    ['head', '/auth/github(\\?.*)?', this.github.bind(this)],
    ['all', '/auth/facebook(\\?.*)?', this.facebook.bind(this)],
    ['head', '/auth/facebook(\\?.*)?', this.facebook.bind(this)],
    ['all', '/auth/persona(\\?.*)?', this.persona.bind(this)],
    ['head', '/auth/persona(\\?.*)?', this.persona.bind(this)],
    ['get', '/auth/logout', this.logout.bind(this)]
  ];
}

AuthController.prototype = Object.create(Controller.prototype, { constructor: AuthController });

AuthController.prototype.setIDP = function (idp) {
  this._idp = idp;
}

AuthController.prototype.setStore = function (store) {
  this._store = store;
};

AuthController.prototype.index = function (req, res) {
  req.view.template = 'auth_index';
  req.view.context.page = { title: 'Sign in' };
  this._view.render(req, res);
};

AuthController.prototype.authWith = function (req, res) {
  var params = {
    state: req.session.uid()
  };

  if (req.params.idp.toLowerCase() === 'google') {
    params.scope = [ 'https://www.googleapis.com/auth/plus.login',  ];
    params.access_type = 'offline';
    params.request_visible_actions = 'http://schemas.google.com/AddActivity http://schemas.google.com/CommentActivity https://schemas.google.com/CreateActivity';
  }

  if (!req.params.idp || !this._idp[req.params.idp.toLowerCase()]) {
    res.render500();
  }
  else {
    res.redirect(this._idp[req.params.idp.toLowerCase()]().authUrl(params), 302);
  }
};

AuthController.prototype.google = function (req, res) {
  if (req.data.state !== req.session.uid()) {
    res.render400();
  }
  else {
    this._idp.google().identity(req.data.code, function (err, identity) {
      if (err) {
        res.render500(err);
      }
      else {
        this._user().findByIdentity(identity.id, 1, function (err, userData) {
          if (err) {
            res.render500(err);
          }
          else if (!userData) {
            req.session.set('account_new', { identity: identity, provider_id: 1, primary_identity: true }, function (err) {
              res.redirect('/account/new', 302);
            });
          }
          else {
            req.session.set('current_user_id', userData.user_id, function (err) {
              var user = this._user();
              var idToken = this._identityToken();
              user.setData({
                software_version_id: req.config.softwareVersion,
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
                res.redirect('/', 302);
              });
            }.bind(this));
          }
        }.bind(this));
      }
    }.bind(this));
  }
}

AuthController.prototype.github = function (req, res) {
  if (req.data.state !== req.session.uid()) {
    res.render400();
  }
  else {
    this._idp.github().identity(req.data.code, function (err, identity) {
      if (err) {
        res.render500(err);
      }
      else {
        this._user().findByIdentity(identity.id, 2, function (err, userData) {
          if (err) {
            res.render500(err);
          }
          else if (!userData) {
            req.session.set('account_new', { identity: identity, provider_id: 2, primary_identity: true }, function (err) {
              res.redirect('/account/new', 302);
            });
          }
          else {
            req.session.set('current_user_id', userData.user_id, function (err) {
              var user = this._user();
              user.setData({
                software_version_id: req.config.softwareVersion,
                user_id: userData.user_id,
                date: new Date()
              });
              user.updateLastLogin(function (err) {
                res.redirect('/', 302);
              });
            }.bind(this));
          }
        }.bind(this));
      }
    }.bind(this));
  }
};

AuthController.prototype.facebook = function (req, res) {
  if (req.data.state !== req.session.uid()) {
    res.render400();
  }
  else {
    this._idp.facebook().identity(req.data.code, function (err, identity) {
      if (err) {
        res.render500(err);
      }
      else {
        this._user().findByIdentity(identity.id, 3, function (err, userData) {
          if (err) {
            res.render500(err);
          }
          else if (!userData) {
            req.session.set('account_new', { identity: identity, provider_id: 3, primary_identity: true }, function (err) {
              res.redirect('/account/new', 302);
            });
          }
          else {
            req.session.set('current_user_id', userData.user_id, function (err) {
              var user = this._user();
              user.setData({
                software_version_id: req.config.softwareVersion,
                user_id: userData.user_id,
                date: new Date()
              });
              user.updateLastLogin(function (err) {
                res.redirect('/', 302);
              });
            }.bind(this));
          }
        }.bind(this));
      }
    }.bind(this));
  }
};

AuthController.prototype.persona = function (req, res) {
  this._idp.persona().identity(req.data.assertion, function (err, identity) {
    if (err) {
      res.render500(err);
    }
    else {
      this._user().findByIdentity(identity.id, 4, function (err, userData) {
        if (err) {
          res.render500(err);
        }
        else if (!userData) {
          req.session.set('account_new', { identity: identity, provider_id: 4, primary_identity: true }, function (err) {
            res.setHeader('content-type', 'application/json; charset=UTF-8');
            res.end(JSON.stringify('/account/new'));
          });
        }
        else {
          req.session.set('current_user_id', userData.user_id, function (err) {
            var user = this._user();
            user.setData({
              software_version_id: req.config.softwareVersion,
              user_id: userData.user_id,
              date: new Date()
            });
            user.updateLastLogin(function (err) {
              res.setHeader('content-type', 'application/json; charset=UTF-8');
              res.end(JSON.stringify('/'));
            });
          }.bind(this));
        }
      }.bind(this));
    }
  }.bind(this));
};

AuthController.prototype.logout = function (req, res) {
  req.session.remove(function (err) {
    res.redirect('/', 302);
  });
};

AuthController.prototype._user = function () {
  return new User(this._store.user);
}

AuthController.prototype._identityToken = function () {
  return new IdentityToken(this._store.identityToken);
};

function newAuthController(view, idp, store) {
  var controller = new AuthController(boundMethods);
  controller.setView(view);
  controller.setIDP(idp);
  controller.setStore(store);
  return controller;
}

module.exports = newAuthController;
