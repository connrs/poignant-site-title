var Ftybr = require('ftybr');
var RequestHandler = require('lib/util/request-handler');
var ErrorRequestHandler = RequestHandler.ErrorRequestHandler;
var RequestListener = require('lib/util/request-listener');
var Template = require('../../lib/templates/');
var forEach = require('lib/util/for-each');

//var FormData = require('barnacle-parse-formdata');
//var addTo = require('barnacle-add-to');
//var addToConfig = addTo.bind(addTo, 'config');
//var addToNavigation = addTo.bind(addTo, 'navigation');
//var addRedirect = require('barnacle-redirect');
//var hasPermission = require('../../lib/middleware/barnacles/has-permission');
//var flashMessages = require('barnacle-flash-messages')(['flash_message']);
var getUser = require('../../lib/middleware/barnacles/get-user');

var errorHandler = function (app, error) {
  var template;

  error.config = app.config;
  error.navigation = app.navigation;
  template = new Template(error, 'error');
  console.error(error.stack);

  return template.generate('error_' + (error.statusCode || 500), error);
};

function init(app, done) {
  var router = new Ftybr();
  var requestListener = new RequestListener();

  forEach(router.registerController.bind(router), app.controllers);
  requestListener.setRouter(router);
  requestListener.setErrorHandler(errorHandler.bind(errorHandler, app));
  requestListener.setRequestHandler(RequestHandler);
  requestListener.setErrorRequestHandler(ErrorRequestHandler);
  app.requestListener = requestListener.handler;

  done();
}

module.exports = init;
