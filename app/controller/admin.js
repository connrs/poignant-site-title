var Controller = require('./core');
var Post = require('../../lib/models/post.js');
var boundMethods = [
  'index'
];

function AdminController() {
  Controller.apply(this, arguments);
}

AdminController.prototype = Object.create(Controller.prototype, { constructor: AdminController });

AdminController.prototype.setPostData = function (postData) {
  this._postData = postData;
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

  this._newPost().getActivity(function (err, result) {
    if (err) {
      res.render500(err);
    }
    else {
      req.view.context.post_activity = result.rows;
      render.apply(this);
    }
  }.bind(this));
};

AdminController.prototype._newPost = function () {
  var post = new Post();
  post.setPostData(this._postData);
  return post;
}

function newAdminController(view, postData) {
  var controller = new AdminController(boundMethods);
  controller.setView(view);
  controller.setPostData(postData);
  return controller;
}

module.exports = newAdminController;
