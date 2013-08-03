var Controller = require('./core');
var boundMethods = [
  'index',
  'withGoogle',
  'google',
  'withGithub',
  'github',
  'withFacebook',
  'facebook'
];

function AuthController() {
  Controller.apply(this, arguments);
}

AuthController.prototype = Object.create(Controller.prototype, { constructor: AuthController });

AuthController.prototype.setProviders = function (providers) {
  this._providers = providers;
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

AuthController.prototype.withGoogle = function (req, res) {
  res.redirect(this._providers.google.getAuthorizeUrl({state: req.session.uid()}), 302);
};

AuthController.prototype.withGithub = function (req, res) {
  res.redirect(this._providers.github.getAuthorizeUrl({state: req.session.uid()}), 302);
};

AuthController.prototype.withFacebook = function (req, res) {
  res.redirect(this._providers.facebook.getAuthorizeUrl({state: req.session.uid()}), 302);
};

AuthController.prototype.google = function (req, res) {
  if (req.data.state !== req.session.uid()) {
    res.render400();
    return;
  }

  this._providers.google.getProviderUser(req.data.code, function (err, providerUser) {
    if (err) {
      res.render500(err);
      return;
    }
    else if (!providerUser.userData) {
      req.session.set('account_new', { payload: providerUser.payload, provider_id: 1 }, function (err) {
        res.redirect('/account/new', 302);
      });
    }
    else {
      req.session.set('current_user_id', providerUser.userData.user_id, function (err) {
        var user = this._newUser();
        user.setData({
          software_version_id: req.config.softwareVersion,
          user_id: providerUser.userData.user_id,
          date: new Date()
        });
        user.updateLastLogin(function (err) {
          res.redirect('/', 302);
        });
      }.bind(this));
    }
  }.bind(this));
}

AuthController.prototype.github = function (req, res) {
  if (req.data.state !== req.session.uid()) {
    res.render400();
    return;
  }

  this._providers.github.getProfile(req.data.code, function (err, user) {
    var user;

    if (err) {
      res.render500(err);
      return;
    }

    this._newUser().findByProviderUid(user.login, function (err, data) {
      if (err) {
        res.render500(err);
      }
      else if (!data) {
        req.session.set('account_new', { payload: { uid: user.login }, provider_id: 2 }, function (err) {
          res.redirect('/account/new', 302);
        });
      }
      else {
        req.session.set('current_user_id', data.user_id, function (err) {
          var user = this._newUser();
          user.setData({
            software_version_id: req.config.softwareVersion,
            user_id: data.user_id,
            date: new Date()
          });
          user.updateLastLogin(function (err) {
            res.redirect('/', 302);
          });
        }.bind(this));
      }
    }.bind(this));
  }.bind(this));
};

AuthController.prototype.facebook = function (req, res) {
  if (req.data.state !== req.session.uid()) {
    res.render400();
    return;
  }

  this._providers.facebook.getProfile(req.data.code, function (err, user) {
    var user;

    if (err) {
      console.log(err);
      res.render500(err);
      return;
    }

    this._newUser().findByProviderUid(user.id, function (err, data) {
      if (err) {
        res.render500(err);
      }
      else if (!data) {
        req.session.set('account_new', { payload: { uid: user.id }, provider_id: 3 }, function (err) {
          res.redirect('/account/new', 302);
        });
      }
      else {
        req.session.set('current_user_id', data.user_id, function (err) {
          var user = this._newUser();
          user.setData({
            software_version_id: req.config.softwareVersion,
            user_id: data.user_id,
            date: new Date()
          });
          user.updateLastLogin(function (err) {
            res.redirect('/', 302);
          });
        }.bind(this));
      }
    }.bind(this));
  }.bind(this));
};

AuthController.prototype.logout = function (req, res) {
  req.session.remove(req.session.uid(), function (err) {
    res.redirect('/', 302);
  });
};

AuthController.prototype._newUser = function () {
  var user = new this._User();
  user.setUserData(this._userData);
  return user;
};

function newAuthController(view, providers, User, userData) {
  var controller = new AuthController(boundMethods);
  controller.setView(view);
  controller.setProviders(providers);
  controller.setUser(User);
  controller.setUserData(userData);
  return controller;
}

module.exports = newAuthController;
