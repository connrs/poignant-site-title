var Controller = require('./core');
var User = require('../../lib/model/user.js');
var boundMethods = [
  'new', 'postNew'
];

function AccountController() {
  Controller.apply(this, arguments);
  this._routes = [
    ['get', '/account/new', this.new.bind(this)],
    ['head', '/account/new', this.new.bind(this)],
    ['post', '/account/new', this.postNew.bind(this)]
  ];
}

AccountController.prototype = Object.create(Controller.prototype, { constructor: AccountController });

AccountController.prototype.setUserStore = function (userStore) {
  this._userStore = userStore;
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
    user = this._user();
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

AccountController.prototype._user = function () {
  return new User(this._userStore);
}

function newAccountController(view, userStore) {
  var controller = new AccountController(boundMethods);
  controller.setView(view);
  controller.setUserStore(userStore);
  return controller;
}

module.exports = newAccountController;
