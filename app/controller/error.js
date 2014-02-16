var Controller = require('./core');
var boundMethods = [
  'notFound','internalServerError','badRequest','forbidden'
];

function ErrorController() {
  Controller.apply(this, arguments);
  this._routes = [
    ['404', this.notFound.bind(this)],
    ['500', this.internalServerError.bind(this)],
    ['400', this.badRequest.bind(this)],
    ['403', this.forbidden.bind(this)]
  ];
}

ErrorController.prototype = Object.create(Controller.prototype, { constructor: ErrorController });

ErrorController.prototype.notFound = function (req, res, message) {
  var errorString = '';

  if (message instanceof Error && req.config.env !== 'LIVE') {
    errorString += message.stack;
  }
  else if (message && req.config.env !== 'LIVE') {
    errorString += message;
  }

  req.view.context = req.view.context || {};
  req.view.context.errorString = errorString;
  req.view.template = 'error_404';
  this._view.render(req, res);
};

ErrorController.prototype.internalServerError = function (req, res, message) {
  var errorString = '';

  if (message instanceof Error && req.config.env !== 'LIVE') {
    errorString += message.stack;
  }
  else if (message && req.config.env !== 'LIVE') {
    errorString += message;
  }

  req.view.context = req.view.context || {};
  req.view.context.errorString = errorString;
  req.view.template = 'error_500';
  this._view.render(req, res);
};

ErrorController.prototype.badRequest = function (req, res, message) {
  var errorString = '';

  if (message instanceof Error && req.config.env !== 'LIVE') {
    errorString += message.stack;
  }
  else if (message && req.config.env !== 'LIVE') {
    errorString += message;
  }

  req.view.context = req.view.context || {};
  req.view.context.errorString = errorString;
  req.view.template = 'error_400';
  this._view.render(req, res);
};

ErrorController.prototype.forbidden = function (req, res, message) {
  var errorString = '';

  if (message instanceof Error && req.config.env !== 'LIVE') {
    errorString += message.stack;
  }
  else if (message && req.config.env !== 'LIVE') {
    errorString += message;
  }

  req.view.context = req.view.context || {};
  req.view.context.errorString = errorString;
  req.view.template = 'error_403';
  this._view.render(req, res);
};

function newErrorController(view) {
  var controller = new ErrorController(boundMethods);
  controller.setView(view);
  return controller;
}

module.exports = newErrorController;
