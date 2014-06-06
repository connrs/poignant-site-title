var plumb = require('../../lib/plumb/index.js');
var Template = require('../../lib/templates/');
var Ftybr = require('ftybr');
var FormData = require('barnacle-parse-formdata');
var addTo = require('barnacle-add-to');
var addToConfig = addTo.bind(addTo, 'config');
var addToNavigation = addTo.bind(addTo, 'navigation');
var addRedirect = require('barnacle-redirect');
var hasPermission = require('../../lib/middleware/barnacles/has-permission');
var flashMessages = require('barnacle-flash-messages')(['flash_message']);
var getUser = require('../../lib/middleware/barnacles/get-user');
var BarnacleView = require('barnacle-view');
var PassThrough = require('stream').PassThrough;

function bindErrorHandler(handler, emitter) {
  return function (emitter) {
    emitter.on.bind('error', handler);
  }
}

function requestListener(app, req, res) {
  var parseFormData = new FormData();
  var route = app.router.getRoute(req);
  var viewStream = new BarnacleView();

  viewStream.setErrorHandler(function (error, statusCode) {
    var template;

    error.config = app.config;
    error.navigation = app.navigation;
    template = new Template(error, 'error');
    console.error(error.stack);

    return template.generate('error_' + statusCode, error);
  });

  if (route instanceof Error) {
    plumb([req, parseFormData, viewStream, res]);
    parseFormData.emit('error', route);
    return;
  }

  var action = route.action();
  var streams = [ parseFormData, addTo('params', route.params), app.session(req, res), getUser(app.store.user), addToConfig(app.config), addToNavigation(app.navigation), addRedirect(res), hasPermission(), flashMessages() ];

  if (typeof route.formFilters === 'function') {
    streams.push(route.formFilters());
  }

  var viewTemplate;

  if (route.template) {
    viewTemplate = route.template();
  }

  streams.push(action);

  if (viewTemplate) {
    streams.push(viewTemplate);
  }
  var streamOnErrorHandler = streams[streams.length - 1].emit.bind(streams[streams.length - 1], 'error');
  streams.slice(0, streams.length - 1).forEach(bindErrorHandler(streamOnErrorHandler));

  plumb([].concat(req, streams, viewStream, res));
};

function init(app, done) {
  app.router = new Ftybr();
  app.controllers.forEach(app.router.registerController.bind(app.router));
  app.requestListener = requestListener.bind(null, app);
  done();
}

module.exports = init;
