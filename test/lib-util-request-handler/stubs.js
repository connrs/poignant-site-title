var Transform = require('stream').Transform;
var PassThrough = require('stream').PassThrough;
var newO2BTransform = function (action) {
  function N(options) {
    options = options || {};
    Transform.call(this, options);
    this._writableState.objectMode = true;
    this._readableState.objectMode = false;
  }

  N.prototype = Object.create(Transform.prototype, {
    constructor: { value: Transform }
  });

  N.prototype._transform = action;

  return new N();
};
var newB2OTransform = function (action) {
  function N(options) {
    options = options || {};
    Transform.call(this, options);
    this._writableState.objectMode = false;
    this._readableState.objectMode = true;
  }

  N.prototype = Object.create(Transform.prototype, {
    constructor: { value: Transform }
  });

  N.prototype._transform = action;

  return new N();
};
var newResponse = function () {
  var res = new PassThrough();
  res.setHeader = function () {};
  return res;
};
var returner = function (thing) {
  return function () {
    return thing;
  }
};

module.exports = {
  newO2BTransform: newO2BTransform,
  newB2OTransform: newB2OTransform,
  newResponse: newResponse,
  returner: returner
};
