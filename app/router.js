var ftybr = require('ftybr');
var formData = require('ftybr-parse-formdata');
var addToReq = require('ftybr-add-to-req');
var addToRes = require('ftybr-add-to-res');
var redirect = require('../lib/ftybr-redirect');
var hasPermission = require('../lib/ftybr-has-permission');
var pgSession = require('ftybr-pg-session');
var getUser = require('../lib/ftybr-get-user');

function init(app, done) {
  app.router = ftybr();
  app.router.registerMiddleware(pgSession({pg: app.pg, conString: app.pgConString}));
  app.router.registerMiddleware(addToReq('config', app.config));
  app.router.registerMiddleware(addToReq('navigation', app.navigation));
  app.router.registerMiddleware(redirect);
  app.router.registerMiddleware(formData);
  app.router.registerMiddleware(hasPermission);
  app.router.registerMiddleware(function (req, res, done) {
    req.view = { context: {} };
    done();
  });
  app.router.registerMiddleware(getUser(app.store.user));
  Object.keys(app.controller).forEach(function (name) {
    if (name === 'error') {
      app.router.registerErrorController(app.controller[name]);
    }
    else {
      app.router.registerController(app.controller[name]);
    }
  });
  done();
}

module.exports = init;
