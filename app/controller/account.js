var Controller = require('./core');
var boundMethods = [
  'new', 'postNew'
];

function AccountController() {
  Controller.apply(this, arguments);
}

AccountController.prototype = Object.create(Controller.prototype, { constructor: AccountController });

AccountController.prototype.setUser = function (User) {
  this._User = User;
};

AccountController.prototype.setUserData = function (userData) {
  this._userData = userData;
}

AccountController.prototype.new = function (req, res) {
  if (!req.session.get('account_new')) {
    req.session.remove();
    res.redirect('/', 302);
  }
  else {
    req.view = {
      template: 'account_new',
      context: {
        errors: req.session.get('account_new_errors')
      }
    };
    this._view.render(req, res);
  }
}

AccountController.prototype.postNew = function (req, res) {
  var user;
  var sessionData = {};
  var accountNew;

  if (!req.session.get('account_new')) {
    req.session.remove();
    res.redirect('/', 302);
  }
  else {
    accountNew = req.session.get('account_new');
    sessionData.payload = accountNew.payload;
    sessionData.provider_id = accountNew.provider_id;
    user = new this._User();
    user.setUserData(this._userData);
    user.setData({
      name: req.data.name,
      email: sessionData.payload.email,
      provider_id: sessionData.provider_id,
      uid: sessionData.payload.uid,
      by: 0
    });
    user.validate(function (err, errors) {
      if (err) {
        res.render500(err);
      }
      else if (errors) {
        req.session.set('account_new_errors', errors);
        res.redirect('/account/new', 302);
      }
      else {
        user.save(function (err, id) {
          if (err) {
            res.render500(err);
          }
          else {
            req.session.set('current_user_id', id);
            res.redirect('/', 302);
          }
        });
      }
    });
  }
};

function newAccountController(view, User, userData) {
  var controller = new AccountController(boundMethods);
  controller.setView(view);
  controller.setUser(User);
  controller.setUserData(userData);
  return controller;
}

module.exports = newAccountController;
