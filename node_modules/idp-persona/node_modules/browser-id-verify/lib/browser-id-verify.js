var request = require('request');

function BrowserIDVerify(options) {
  this._checkOptionsValid(options || {});
  this._assertion = options.assertion;
  this._audience = options.audience;
  this._url = options.url;
}

BrowserIDVerify.prototype.verify = function (callback) {
  if (isUndefined(callback)) {
    throw noCallbackError();
  }

  this._callback = callback;
  request.post(this._url, this._formObject(), this._verifyRequestBody.bind(this));
};

BrowserIDVerify.prototype._checkOptionsValid = function (options) {
  if (isUndefined(options.assertion)) {
    throw noAssertionError();
  }

  if (isUndefined(options.audience)) {
    throw noAudienceError();
  }

  if (isUndefined(options.url)) {
    throw noUrlError();
  }
};

BrowserIDVerify.prototype._formObject = function () {
  var obj = {
    form: {
      assertion: this._assertion,
      audience: this._audience
    }
  };
  return obj;
};

BrowserIDVerify.prototype._verifyRequestBody = function (err, res, body) {
  if (err) {
    this._callback(err);
  }
  else if (this._httpStatusError(res.statusCode)) {
    this._callback(httpResponseError());
  }
  else {
    this._parseJSONResponse(body);
    this._returnResponse();
  }
};

BrowserIDVerify.prototype._httpStatusError = function (statusCode) {
  return statusCode !== 200;
};

BrowserIDVerify.prototype._parseJSONResponse = function (body) {
  try {
    this._body = JSON.parse(body);
  }
  catch (err) {
    this._jsonParseError = err;
  }
};

BrowserIDVerify.prototype._returnResponse = function () {
  if (this._jsonParseError) {
    this._callback(this._jsonParseError);
  }
  else if (this._assertionFailedWithReason()) {
    this._callback(this._failureReasonError());
  }
  else if (this._assertionSuccess()) {
    this._callback(null, this._body);
  }
  else {
    this._callback(nonStandardJSONResponse());
  }
};

BrowserIDVerify.prototype._assertionFailedWithReason = function () {
  return this._body.status === 'failure';
};

BrowserIDVerify.prototype._failureReasonError = function () {
  return new Error(this._body.reason);
};

BrowserIDVerify.prototype._assertionSuccess = function () {
  return this._body.status === 'okay' && this._body.audience === this._audience;
};

function browseridVerify(options, callback) {
  var verify = new BrowserIDVerify(options);
  verify.verify(callback);
}

function isUndefined(option) {
  return option === undefined;
}

function noAssertionError() {
  return new Error('No assertion provided');
}

function noAudienceError() {
  return new Error('No audience provided');
}

function noUrlError() {
  return new Error('No URL provided'); 
}

function noCallbackError() {
  return new Error('No callback provided');
}

function httpResponseError() {
  return new Error('HTTP response error');
}

function nonStandardJSONResponse() {
  return new Error('Non-standard JSON response');
}

module.exports = browseridVerify;
