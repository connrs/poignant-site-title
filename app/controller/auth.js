var Controller = require('./core');
var User = require('../../lib/models/user.js');
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
}

AuthController.prototype = Object.create(Controller.prototype, { constructor: AuthController });

AuthController.prototype.setIDP = function (idp) {
  this._idp = idp;
}

AuthController.prototype.setUser = function (User) {
  this._User = User;
};

AuthController.prototype.setUserData = function (userData) {
  this._userData = userData;
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
    params.scope = [ 'https://www.googleapis.com/auth/plus.login' ];
    params.access_type = 'offline';
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
        this._newUser().findByIdentity(identity.id, 1, function (err, userData) {
          console.log(identity);
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
              var user = this._newUser();
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
        this._newUser().findByIdentity(identity.id, 2, function (err, userData) {
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
              var user = this._newUser();
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
        this._newUser().findByIdentity(identity.id, 3, function (err, userData) {
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
              var user = this._newUser();
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
      this._newUser().findByIdentity(identity.id, 4, function (err, userData) {
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
            var user = this._newUser();
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
  req.session.remove(req.session.uid(), function (err) {
    res.redirect('/', 302);
  });
};

AuthController.prototype._newUser = function () {
  var user = new User();
  user.setUserData(this._userData);
  return user;
};

function newAuthController(view, idp, User, userData) {
  var controller = new AuthController(boundMethods);
  controller.setView(view);
  controller.setIDP(idp);
  controller.setUser(User);
  controller.setUserData(userData);
  return controller;
}

module.exports = newAuthController;
