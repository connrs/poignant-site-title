var Template = require('./templates.js');
var Ftybr = require('ftybr');
var FormData = require('barnacle-parse-formdata');
var addTo = require('barnacle-add-to');
var redirect = require('barnacle-redirect');
var pgSession = require('barnacle-pg-session');
var hasPermission = require('../lib/middleware/barnacles/has-permission');
var clean = require('../lib/middleware/barnacles/clean')();
var getUser = require('../lib/middleware/barnacles/get-user');
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
  var cleanUp = clean();
  var streams = [ parseFormData, session, addUser, addConfig, addNavigation, addRedirect, addHasPermission ];

  viewStream.setErrorHandler(function (error, statusCode) {
    var template = new Template(error, 'default');

    return template.generate('error_' + statusCode, error);
  });
  bindStreamErrorEvents(streams, streamOnError(errorHandler));
  streams = [].concat(req, streams, action, cleanUp, viewStream, res);
  plumb(streams);
};

function init(app, done) {
  app.router = new Ftybr();
  app.session = pgSession({pg: app.pg, conString: app.pgConString});
  Object.keys(app.controller).forEach(registerControllers(app.router, app.controller));
  app.requestListener = requestListener.bind(null, app);
  done();
}

module.exports = init;
