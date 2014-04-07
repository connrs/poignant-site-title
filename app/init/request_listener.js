var Template = require('../../lib/templates/');
var Ftybr = require('ftybr');
var FormData = require('barnacle-parse-formdata');
var addTo = require('barnacle-add-to');
var redirect = require('barnacle-redirect');
var hasPermission = require('../../lib/middleware/barnacles/has-permission');
var flashMessages = require('barnacle-flash-messages')(['flash_message']);
var getUser = require('../../lib/middleware/barnacles/get-user');
var BarnacleView = require('barnacle-view');

function registerControllers(router, controllers) {
  return function (name) {
    return router.registerController(controllers[name]);
  };
}

function bindStreamErrorEvents(streams, func) {
  streams.forEach(func);
}

function streamOnError(handler) {
  return function (stream) {
    stream.on('error', handler);
  };
}

function plumb(streams) {
  return streams.reduce(pipe);
}

function pipe(previous, current, index) {
  return previous.pipe(current);
};

function requestListener(app, req, res) {
  var session = app.session(req, res);
  var addUser = getUser(app.store.user);
  var parseFormData = new FormData();
  var action = app.router.request();
  var addRedirect = redirect(res);
  var addConfig = addTo('config', app.config);
  var addNavigation = addTo('navigation', app.navigation);
  var addHasPermission = hasPermission();
  var viewStream = new BarnacleView();
  var errorHandler = action.emit.bind(action, 'error');
  var flash = flashMessages();
  var streams = [ parseFormData, session, addUser, addConfig, addNavigation, addRedirect, addHasPermission, flash ];

  viewStream.setErrorHandler(function (error, statusCode) {
    var template;

    error.config = app.config;
    error.navigation = app.navigation;
    template = new Template(error, 'error');

    return template.generate('error_' + statusCode, error);
  });
  bindStreamErrorEvents(streams, streamOnError(errorHandler));
  streams = [].concat(req, streams, action, viewStream, res);
  plumb(streams);
};

function init(app, done) {
  app.router = new Ftybr();
  Object.keys(app.controller).forEach(registerControllers(app.router, app.controller));
  app.requestListener = requestListener.bind(null, app);
  done();
}

module.exports = init;
