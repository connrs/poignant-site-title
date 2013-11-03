var Controller = require('./core');
var boundMethods = [
  'index'
];

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

AdminController.prototype.beforeAction = function (callback, req, res) {
  req.view.layout = 'admin';
  callback(req, res);
};

AdminController.prototype.index = function (req, res) {
  if (!req.hasPermission()) {
    res.render403();
    return;
  }

  var count = 1;

  req.view.template = 'admin_index';

  function render() {
    if (--count === 0) {
      this._view.render(req, res);
    }
  }

  this._postActivityStore.getActivity(function (err, postActivity) {
    if (err) {
      res.render500(err);
    }
    else {
      req.view.context.post_activity = postActivity;
      render.apply(this);
    }
  }.bind(this));
};

function newAdminController(view, postActivityStore) {
  var controller = new AdminController(boundMethods);
  controller.setView(view);
  controller.setPostActivityStore(postActivityStore);
  return controller;
}

module.exports = newAdminController;
