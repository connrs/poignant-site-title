var templateStream = require('app/stream/template-stream');
var formFilterStream = require('app/stream/form-filter-stream');
var addTo = require('barnacle-add-to');
var redirect = require('barnacle-redirect');
var redir = function (opts) {
  return redirect(opts.response);
};
var getUserStreamBuilder = require('app/builder/get-user-stream')();
var authoriseUserStreamBuilder = require('app/builder/authorise-user-stream');
var templateStreamBuilder = require('app/builder/template-stream');
var parseFormDataStreamBuilder = require('app/builder/parse-form-data-stream')();
var flashMessages = require('barnacle-flash-messages')(['flash_message']);
var StreamActionController = require('app/controller/stream-action');
var ParseFormData = require('barnacle-parse-formdata');
var formData = function (opts) {
  return new ParseFormData(opts);
};
var HTTPError = require('http-errors');

function AdminController(options) {
  var sess = function (opts) {
    return options.session(opts.request, opts.response);
  };
  var addNav = function () {
    return addTo('navigation', options.navigation);
  };
  var addConfig = function () {
    return addTo('config', options.config);
  };
  StreamActionController.apply(this, arguments);

  this._routes = [
    ['get', '/admin', [
      parseFormDataStreamBuilder,
      sess,
      getUserStreamBuilder,
      redir,
      authoriseUserStreamBuilder(),
      flashMessages,
      addNav,
      addConfig,
      this._createActionStream('index'),
      templateStreamBuilder('admin','admin_index')
    ]],
    ['head', '/admin', [
      parseFormDataStreamBuilder,
      sess,
      getUserStreamBuilder,
      redir,
      authoriseUserStreamBuilder(),
      flashMessages,
      addNav,
      addConfig,
      this._createActionStream('index'),
      templateStreamBuilder('admin','admin_index')
    ]]
  ];
}

AdminController.prototype = Object.create(StreamActionController.prototype, { constructor: AdminController });

AdminController.prototype.setPostActivityStore = function (postActivityStore) {
  this._postActivityStore = postActivityStore;
};

AdminController.prototype.index = function (obj, done) {
  this._postActivityStore.getActivity(function (err, postActivity) {
    if (err) { return done(err); }

    obj.context = {
      current_navigation: 'admin_index',
      post_activity: postActivity
    }

    done(null, obj);
  });
};

function newAdminController(opts, postActivityStore) {
  var controller = new AdminController(opts);
  controller.setPostActivityStore(postActivityStore);
  return controller;
}

module.exports = newAdminController;
