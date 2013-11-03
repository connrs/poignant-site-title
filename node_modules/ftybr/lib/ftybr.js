var methods = require('methods');
var urlPattern = require('url-pattern');
var errorHandlers = {
  '500': function (req, res) {
    res.end('Internal Server Error');
  },
  '404': function (req, res) {
    res.end('Not Found');
  },
  '400': function (req, res) {
    res.end('Bad Request');
  }
};

function Ftybr() {
  this._routes = [];
  this._middleware = [
    this._bindErrorHandlersToRes.bind(this)
  ];
  this._errorHandlers = {
    '500': errorHandlers['500'],
    '404': errorHandlers['404'],
    '400': errorHandlers['400']
  };
}

methods.forEach(function (method) {
  Ftybr.prototype[method.replace(/[^a-z+]/, '')] = generateMethodFunction(method);
});

Ftybr.prototype.all = function (match, action) {
  this.get(match, action);
  this.post(match, action);
  this.delete(match, action);
  this.put(match, action);
};

Ftybr.prototype.requestListener = function () {
  return function (req, res) {
    this._applyMiddleware(this._middlewareList(), req, res, this._runAction.bind(this, req, res));
  }.bind(this);
};

Ftybr.prototype.registerController = function (controller) {
  var routes = controller.getRoutes();
  var i, method, match, func;

  for (i = 0; i < routes.length; i++) {
    method = routes[i][0];
    match = routes[i][1];
    func = routes[i][2];
    this[method](match, func);
  }
};

Ftybr.prototype.registerErrorController = function (controller) {
  var routes = controller.getRoutes();
  var i, statusCode, func;

  for (i = 0; i < routes.length; i++) {
    statusCode = routes[i][0].toString();
    func = routes[i][1];
    this._errorHandlers[statusCode] = func;
  }
};

Ftybr.prototype.registerMiddleware = function (middleware) {
  this._middleware.push(middleware);
};

Ftybr.prototype._middlewareList = function () {
  return [].concat(this._middleware);
};

Ftybr.prototype._applyMiddleware = function (middleware, req, res, done) {
  middleware.reduceRight(this._reduceMiddlewareList.bind(this, req, res), done)();
};

Ftybr.prototype._reduceMiddlewareList = function (req, res, prev, curr) {
  return nextMiddleware(req, res, curr, prev);
};

Ftybr.prototype._runAction = function (req, res, err) {
  if (err) {
    this._renderMiddlewareError(req, res, err);
  }
  else if (this._noRoutesRegistered()) {
    res.render500();
  }
  else {
    this._matchRequestToRoute(req, res);
  }
};

Ftybr.prototype._bindErrorHandlersToRes = function (req, res, done) {
  Object.keys(this._errorHandlers).forEach(this._bindErrorHandlerToRes.bind(this, req, res));
  done();
};

Ftybr.prototype._bindErrorHandlerToRes = function (req, res, statusCode) {
  res['render' + statusCode] = this._httpError.bind(this, req, res, +statusCode);
};

Ftybr.prototype._renderMiddlewareError = function (req, res, err) {
  if (res.statusCode !== 200 && typeof res['render' + res.statusCode] === 'function') {
    res['render' + res.statusCode](err);
  }
  else {
    res.render500(err);
  }
};

Ftybr.prototype._noRoutesRegistered = function () {
  return !this._routes.length;
};

Ftybr.prototype._matchRequestToRoute = function (req, res) {
  var action = this._actionForRequest(req);

  if (action === undefined) {
    res.render404();
  }
  else {
    action(req, res);
  }
};

Ftybr.prototype._httpError = function (req, res, statusCode, err, context) {
  res.statusCode = statusCode;

  if (typeof context === 'string') {
    context = { message: context };
  }

  this._errorHandlers[statusCode](req, res, err, context);
};

Ftybr.prototype._actionForRequest = function (req) {
  var length = this._routes.length;
  var route;
  var match;
  var i;

  for (i = 0; i < length; i++) {
    route = this._routes[i];
    match = route.pattern.match(req.url);

    if (this._routeMatchesRequest(req.method, route.method, match)) {
      this._setRequestParameters(req, match);
      return route.action;
    }
  }
};

Ftybr.prototype._routeMatchesRequest = function (reqMethod, routeMethod, match) {
  return reqMethod === routeMethod && match !== null;
};

Ftybr.prototype._setRequestParameters = function (req, parameters) {
  req.params = parameters;
};

function ftybr() {
  var router = new Ftybr();

  return router;
}

function generateMethodFunction(method) {
  return function (match, action) {
    this._routes.push({
      method: method.toUpperCase(),
      pattern: urlPattern(match),
      action: action
    });
  };
}

function nextMiddleware(req, res, middleware, done) {
  return function (err) {
    if (err) {
      done(err);
    }
    else {
      middleware(req, res, done);
    }
  };
}

ftybr.Ftybr = Ftybr;

module.exports = ftybr;
