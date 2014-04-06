var Transform = require('stream').Transform;
var url = require('url');
var qs = require('qs');
var xtend = require('xtend');
var jsonTest = /^application\/json/i;

function ParseFormData(options) {
  Transform.call(this, options);
  this._o = {};
  this._reqBuffer = [];
  this._readableState.objectMode = true;
  this._writableState.objectMode = false;
  this.on('pipe', this._addRequestToObject.bind(this));
}

ParseFormData.prototype = Object.create(Transform.prototype, { constructor: { value: ParseFormData } });

ParseFormData.prototype._transform = function (obj, enc, done) {
  if(this._shouldBufferReq()) {
    this._reqBuffer.push(obj);
  }

  done();
};

ParseFormData.prototype._flush = function (done) {
  try {
    this.push(this._getObject());
    done();
  }
  catch (err) {
    err.statusCode = 400;
    done(err);
  }
};

ParseFormData.prototype._addRequestToObject = function (source) {
  this._o.req = source;
  this._o.data = this._parseRequestSourceQueryString();
};

ParseFormData.prototype._shouldBufferReq = function () {
  return this._reqIsUrlEncoded() || this._reqIsJSON();
};

ParseFormData.prototype._reqIsUrlEncoded = function () {
  return this._o.req.headers && this._o.req.headers['content-type'] && this._o.req.headers['content-type'] === 'application/x-www-form-urlencoded';
};

ParseFormData.prototype._reqIsJSON = function () {
  return this._o.req.headers && this._o.req.headers['content-type'] && jsonTest.test(this._o.req.headers['content-type']);
};

ParseFormData.prototype._parseRequestSourceQueryString = function () {
  return qs.parse(url.parse(this._o.req.url).query);
};

ParseFormData.prototype._getObject = function () {
  var o = this._o;
  o.data = xtend(this._o.data, this._parseReqBuffer());
  return o;
};

ParseFormData.prototype._parseReqBuffer = function (done) {
  var parsed;

  if (this._reqIsUrlEncoded()) {
    parsed = qs.parse(Buffer.concat(this._reqBuffer).toString());
  }
  else if (this._reqIsJSON()) {
    parsed = JSON.parse(Buffer.concat(this._reqBuffer).toString());
  }

  return parsed;
};

module.exports = ParseFormData;
