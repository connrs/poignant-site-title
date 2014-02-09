var Transform = require('stream').Transform;
var statusCodes = require('./status-codes.js');

function ViewStream(options) {
  if (!(this instanceof ViewStream)) {
    return new ViewStream(options);
  }

  Transform.call(this, options);
  options = options || {};
  this._registerErrorHandler();
  this._pushedData = false;
  this._destination = null;
  this._errorHandlers = options.errors || {};
  this._contentType = options.contentType;
}

ViewStream.prototype = Object.create(Transform.prototype, { constructor: { value: Transform }});

ViewStream.prototype.pipe = function (destination) {
  this._destination = destination;
  this._setDestinationContentType();

  return Transform.prototype.pipe.call(this, destination);
};

ViewStream.prototype._setDestinationContentType = function () {
  if (this._destination.setHeader) {
    this._destination.setHeader('Content-Type', this._contentType);
  }
};

ViewStream.prototype._registerErrorHandler = function () {
  this.on('error', this._callErrorHandler.bind(this));
};

ViewStream.prototype._callErrorHandler = function (err) {
  if (!this._hasPushedData()) {
    this.push(this._generateErrorHandlerOutput(err));
  }

  this.end();
};

ViewStream.prototype._hasPushedData = function () {
  return this._pushedData;
};

ViewStream.prototype._generateErrorHandlerOutput = function (err) {
  var handler;

  err.statusCode = err.statusCode || 500;
  this._setDestinationStatusCode(err.statusCode);
  handler = this._getErrorHandlerFromError(err);

  return handler(err);
};

ViewStream.prototype._setDestinationStatusCode = function (code) {
  if (this._destination) {
    this._destination.statusCode = code;
  }
};

ViewStream.prototype._getErrorHandlerFromError = function (err) {
  if (typeof this._errorHandlers[err.statusCode] === 'function') {
    return this._errorHandlers[err.statusCode];
  }

  return statusCodes[err.statusCode];
};

ViewStream.prototype._transform = function (chunk, encoding, callback) {
  this._pushChunk(chunk);
  callback();
};

ViewStream.prototype._pushChunk = function (chunk) {
  this.push(chunk);

  if (!this._hasPushedData()) {
    this._pushedData = true;
  }
};

module.exports = ViewStream;
