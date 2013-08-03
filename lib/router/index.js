var requestEnhance = require('./request_enhance');
var httpMethods = require('./http_methods');
var newPattern = require('url-pattern');
var url = require('url');

function Router() {
    this._routes = [];
    this._errorHandlers = {};
    this._data = {};

    this.handleError(404, function (req, res, message) {
        res.write('Not Found');
        res.end();
    });

    this.handleError(500, function (req, res, message) {
        res.write('Internal Server Error');
        res.end();
    });
}

httpMethods.forEach(function (httpMethod) {
    Router.prototype[httpMethod.replace(/[^a-z]+/, '')] = (function (){
        return function (match, callback) {
            this._routes.push([httpMethod.toUpperCase(), match, callback]);
        };
    }());
});

Router.prototype.all = function (match, callback) {
    ['get', 'post', 'delete', 'put'].forEach(function (method) {
        this[method](match, callback);
    }.bind(this));
};

Router.prototype.setConfig = function (config) {
    this._config = config;
};

Router.prototype.setNavigation = function (navigation) {
    this._navigation = navigation;
};

Router.prototype.setSessionHandler = function (sessionHandler) {
    this._sessionHandler = sessionHandler;
};

Router.prototype.setUser = function (user) {
  this._user = user;
};

Router.prototype.requestListener = function () {
    return this._onRequest.bind(this);
};

Router.prototype.handleError = function (statusCode, callback) {
    statusCode += '';
    if (statusCode !== statusCode.replace(/!\d*/)) {
        throw new Error('Invalid status code passed to handleError in Router');
    }

    this._errorHandlers[statusCode] = callback;

    if (typeof this['render' + statusCode] !== 'function') {
        this['render' + statusCode] = this.renderError.bind(this, statusCode);
    }
};

Router.prototype.renderError = function (statusCode, req, res, message) {
    res.statusCode = statusCode;
    this._errorHandlers[statusCode](req, res, message);
};

Router.prototype.redirect = function (req, res, location, statusCode) {
    var protocol = !!req.connection.encrypted ? 'https' : 'http';
    var hostname = req.headers.host;
    var currentLocation = protocol + '://' + hostname + req.url;
    var newLocation = url.resolve(currentLocation, location);

    statusCode = statusCode || 200;
    res.setHeader('Location', newLocation);
    res.statusCode = statusCode;
    res.end();
};

Router.prototype._onRequest = function (req, res) {
    this._enhanceRequest(req, res, this._processRoute.bind(this));
};

Router.prototype._enhanceRequest = function (req, res, callback) {
    requestEnhance(req, res, this._config, this._navigation, this._sessionHandler, this._user, callback);
};

Router.prototype._processRoute = function (err, req, res) {
    var routesLength = this._routes.length;
    var reqUrl = req.url;
    var pattern;
    var route;
    var r;

    if (err) {
        // Do 500 error
        this.render500(req, res, err);
        return;
    }

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With');
    this._bindErrorHandlersToResponse(req, res);
    this._bindRedirectToResponse(req, res);

    for (r = 0; r < routesLength; r++) {
      route = this._routes[r];
      pattern = newPattern(route[1]);
      match = pattern.match(reqUrl);
      if (this._getMethod(req) === route[0] && match !== null) {
        req.params = match;
        route[2](req, res);
        return;
      }
    }

    // Do 400 error
    this.render404(req, res);
};

Router.prototype._getMethod = function (req) {
  if (req.headers['x-http-method-override']) {
    return req.headers['x-http-method-override'].toUpperCase();
  }

  return req.method;
};

Router.prototype._bindErrorHandlersToResponse = function (req, res) {
  var statusCode;

  for (statusCode in this._errorHandlers) {
    if (this._errorHandlers.hasOwnProperty(statusCode)) {
      res['render' + statusCode] = this.renderError.bind(this, statusCode, req, res);
    }

  }
};

Router.prototype._bindRedirectToResponse = function (req, res) {
  res.redirect = this.redirect.bind(this, req, res);
};

function newRouter(config, navigation, sessionHandler, user) {
  var router = new Router();

  router.setConfig(config);
  router.setNavigation(navigation);
  router.setSessionHandler(sessionHandler);
  router.setUser(user);

  return router;
}

module.exports = newRouter;
