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
    req.view.template = 'account_new';
    this._view.render(req, res);
  }
}

AccountController.prototype.postNew = function (req, res) {
  var user;
  var accountNew;

  if (!req.session.get('account_new')) {
    req.session.remove();
    res.redirect('/', 302);
  }
  else {
    accountNew = req.session.get('account_new');
    user = new this._User();
    user.setUserData(this._userData);
    user.setData({
      name: req.data.name,
      email: accountNew.identity.email,
      url: accountNew.identity.url,
      provider_id: accountNew.provider_id,
      uid: accountNew.identity.id,
      primary_identity: true,
      by: 0
    });
    user.validate(function (err, errors) {
      if (err) {
        res.render500(err);
      }
      else if (errors) {
        req.view.context.errors = req.session.get('account_new_errors');
        this.new();
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
