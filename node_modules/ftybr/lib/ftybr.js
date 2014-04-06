var methods = require('methods');
var RequestStream = require('./request_stream.js');
var Error500 = require('./error_500.js');
var Error404 = require('./error_404.js');
var urlPattern = require('url-pattern');

function Ftybr() {
  this._routes = [];
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

Ftybr.prototype.request = function () {
  return new RequestStream({router: this});
};

Ftybr.prototype.action = function (req) {
  if (this._noRoutesRegistered()) {
    return new Error500();
  }

  return this._actionForRequest(req) || new Error404();
};

Ftybr.prototype.registerController = function (controller) {
  controller.getRoutes().forEach(this._registerControllerRoute.bind(this));
};

Ftybr.prototype._noRoutesRegistered = function () {
  return !this._routes.length;
};

Ftybr.prototype._registerControllerRoute = function (route) {
  var method = route[0];
  var match = route[1];
  var action = route[2];

  this[method](match, action);
};

Ftybr.prototype._actionForRequest = function (req) {
  return this._routes.reduce(this._matchingRoute.bind(this, req), null);
};

Ftybr.prototype._matchingRoute = function (req, currentAction, route) {
  var action = null;

  if (currentAction !== null) {
    action = currentAction;
  }
  else if (this._routeMatchesRequest(req, route)) {
    action = this._bindParamsToAction(route.action, route.pattern.match(req.url));
  }

  return action;
};

Ftybr.prototype._bindParamsToAction = function (action, params) {
  return function (obj, done) {
    obj.params = params;
    action(obj, done);
  };
};

Ftybr.prototype._routeMatchesRequest = function (req, route) {
  return req.method === route.method && route.pattern.match(req.url) !== null;
};

function generateMethodFunction(method) {
  return function (match, action) {
    this._routes.push({
      method: method.toUpperCase(),
      pattern: urlPattern(match),
      action: action
    });
  };
}

module.exports = Ftybr;
