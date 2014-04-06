var Transform = require('stream').Transform;

function BarnacleView(options) {
  options = options || {};
  options.objectMode = true;
  Transform.call(this, options);
  this._readableState.objectMode = false;
  this.on('pipe', this._onPipe.bind(this));
}

BarnacleView.prototype = Object.create(Transform.prototype, {
  constructor: { value: BarnacleView }
});

BarnacleView.prototype.pipe = function (destination, options) {
  this._response = destination;
  return Transform.prototype.pipe.call(this, destination, options);
};

BarnacleView.prototype.setErrorHandler = function (handler) {
  this._errorHandler = handler;
};

BarnacleView.prototype._onPipe = function (source) {
  source.on('error', this._httpError.bind(this));
};

BarnacleView.prototype._httpError = function (error) {
  this._setResponseHeaders(this._getErrorHeaders(error.headers));
  this._response.statusCode = error.statusCode || 500;
  this._response.end(this._errorHandler(error, this._response.statusCode));
};

BarnacleView.prototype._getErrorHeaders = function (headers) {
  headers = headers || {};
  headers['content-type'] = headers['content-type'] || 'text/html; charset=UTF-8';
  return headers;
};

BarnacleView.prototype._setResponseHeaders = function (headers) {
  if (headers !== undefined) {
    Object.keys(headers).forEach(this._setResponseHeader.bind(this, headers));
  }
};

BarnacleView.prototype._setResponseHeader = function (headers, key) {
  this._response.setHeader(key, headers[key]);
};

BarnacleView.prototype._errorHandler = function () {
  return '';
};

BarnacleView.prototype._transform = function (obj, encoding, done) {
  this._setResponseHeaders(obj.headers);
  done(null, obj.output);
};

module.exports = BarnacleView;
