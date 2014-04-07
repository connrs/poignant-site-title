var Controller = require('./core');
var HTTPError = require('http-errors');

function AdminController() {
  Controller.apply(this, arguments);
  this._routes = [
    ['get', '/admin', this.index.bind(this)],
    ['head', '/admin', this.index.bind(this)]
  ];
}

AdminController.prototype = Object.create(Controller.prototype, { constructor: AdminController });

AdminController.prototype.setPostActivityStore = function (postActivityStore) {
  this._postActivityStore = postActivityStore;
};

AdminController.prototype.index = function (obj, done) {
  if (!obj.hasPermission()) { return done(new HTTPError.NotAuthorizedError()); }

  var count = 1;
  var template = this._template(obj, 'admin');
  var context = {
    'current_navigation': 'admin_index'
  }

  function render() {
    if (--count === 0) {
      done(null, obj);
    }
  }

  this._postActivityStore.getActivity(function (err, postActivity) {
    if (err) { return done(err); }

    context.post_activity = postActivity;
    obj.output = template(context.current_navigation, context);
    done(null, obj);
  }.bind(this));
};

function newAdminController(postActivityStore) {
  var controller = new AdminController();
  controller.setPostActivityStore(postActivityStore);
  return controller;
}

module.exports = newAdminController;
