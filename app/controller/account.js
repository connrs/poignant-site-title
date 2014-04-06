var Controller = require('./core');
var User = require('../../lib/model/user.js');

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

AccountController.prototype.new = function (obj, done) {
  if (!obj.session.get('account_new')) {
    obj.session.remove();
    obj.redirect('/', 302);
  }
  else {
    var template = this._template(obj, 'default');
    var context = {
      current_navigation: 'account_new'
    };

    obj.output = template(context.current_navigation, context);
    done(null, obj);
  }
}

AccountController.prototype.postNew = function (obj, done) {
  var user;
  var accountNew;

  if (!obj.session.get('account_new')) {
    obj.session.remove();
    obj.redirect('/', 302);
  }
  else {
    accountNew = obj.session.get('account_new');
    user = this._user();
    user.setData({
      name: obj.data.name,
      email: accountNew.identity.email,
      url: accountNew.identity.url,
      provider_id: accountNew.provider_id,
      uid: accountNew.identity.id,
      primary_identity: true,
      by: 0
    });
    user.validate(function (err, errors) {
      if (err) {
        done(err);
      }
      else if (errors) {
        obj.formErrors = errors;
        this.new(obj, done);
      }
      else {
        user.save(function (err, id) {
          if (err) {
            done(err);
          }
          else {
            obj.session.set('current_user_id', id, function (err) {
              if (err) { return done(err); }

              obj.redirect('/', 302);
            });
          }
        });
      }
    });
  }
};

AccountController.prototype._user = function () {
  return new User(this._userStore);
}

function newAccountController(userStore) {
  var controller = new AccountController();
  controller.setUserStore(userStore);
  return controller;
}

module.exports = newAccountController;
