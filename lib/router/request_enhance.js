var url = require('url');
var querystring = require('querystring');
var xtend = require('xtend');
var parse_str = require('./parse_str');

function RequestEnhance() {
    this._sessionReady = false;
    this._requestBodyReady = false;
    this._data = '';
    this._requestData = {};
}

RequestEnhance.prototype.setRequest = function (request) {
    this._request = request;
};

RequestEnhance.prototype.setResponse = function (response) {
    this._response = response;
};

RequestEnhance.prototype.setConfig = function (config) {
    this._config = config;
};

RequestEnhance.prototype.setNavigation = function (navigation) {
    this._navigation = navigation;
};

RequestEnhance.prototype.setSessionHandler = function (sessionHandler) {
    this._sessionHandler = sessionHandler;
};

RequestEnhance.prototype.setUser = function (user) {
  this._user = user;
};

RequestEnhance.prototype.enhance = function (callback) {
    this._callback = callback;
    this._request.view = { context: {} };
    this._bindConfigToRequest();
    this._bindNavigationToRequest();
    this._onRequestData(this._concatData.bind(this));
    this._onRequestError(this._runCallbackWithError.bind(this));
    this._onRequestEnd(this._setRequestBody.bind(this));
    this._initialiseSession();
};

RequestEnhance.prototype._bindConfigToRequest = function () {
    this._request.config = this._config;
};

RequestEnhance.prototype._bindNavigationToRequest = function () {
    this._request.navigation = this._navigation;
};

RequestEnhance.prototype._onRequestData = function (callback) {
    this._request.on('data', callback);
};

RequestEnhance.prototype._concatData = function (data) {
    this._data += data;
};

RequestEnhance.prototype._onRequestError = function (callback) {
    this._request.on('error', callback);
};

RequestEnhance.prototype._runCallbackWithError = function (error) {
    this._callback(error);
};

RequestEnhance.prototype._onRequestEnd = function (callback) {
    this._request.on('end', callback);
};

RequestEnhance.prototype._setRequestBody = function () {
    this._request.body = this._data;
    this._parseRequestData();
    this._bindRequestDataToRequest();
    this._requestBodyReady = true;
    this._runCallback();
};

RequestEnhance.prototype._parseRequestData = function () {
  var getData = {};
  var postData = {};

  if (url.parse(this._request.url).query) {
    getData = parse_str(url.parse(this._request.url).query);
  }

  if (typeof this._request.headers['content-type'] === 'string') {
    if (this._request.headers['content-type'] === 'application/x-www-form-urlencoded' && this._request.body !== '') {
      postData = parse_str(this._request.body);
    }

    if (this._request.headers['content-type'].match(/application\/json/gi)) {
      try {
        postData = JSON.parse(this._request.body);
      }
      catch (e) {
        postData = {};
      }
    }
  }

  this._requestData = xtend(getData, postData);
};

RequestEnhance.prototype._bindRequestDataToRequest = function () {
  this._request.data = this._requestData;
};

RequestEnhance.prototype._runCallback = function () {
  if (this._enhancementsComplete()) {
    this._callback(null, this._request, this._response);
  }
};

RequestEnhance.prototype._enhancementsComplete = function () {
  return this._sessionReady && this._requestBodyReady;
};

RequestEnhance.prototype._initialiseSession = function () {
  this._sessionHandler.httpRequest(this._request, this._response, this._onSessionReady.bind(this));
};


RequestEnhance.prototype._onSessionReady = function (error, session) {
  var currentUserId;
  if (error) {
    this._runCallbackWithError(error);
    return;
  }

  this._request.session = session;
  this._request.hasPermission = hasPermission;
  currentUserId = session.get('current_user_id');

  if (currentUserId) {
    this._user.find({ user_id: currentUserId }, function (err, user) {
      if (!err && user) {
        this._request.current_user = user;
      }

      this._sessionReady = true;
      this._runCallback();
    }.bind(this));
  }
  else {
    this._sessionReady = true;
    this._runCallback();
  }
};

function hasPermission(role_names) {
  if (!this.current_user) {
    return false;
  }

  if (role_names === undefined) {
    return 'current_user' in this;
  }

  if (!Array.isArray(role_names)) {
    role_names = [ role_names ];
  }

  return role_names.indexOf(this.current_user.role_name) !== -1;
}

function newRequestEnhance(request, response, config, navigation, sessionHandler, user, readyCallback) {
  var requestEnhance = new RequestEnhance();
  requestEnhance.setRequest(request);
  requestEnhance.setResponse(response);
  requestEnhance.setConfig(config);
  requestEnhance.setNavigation(navigation);
  requestEnhance.setSessionHandler(sessionHandler);
  requestEnhance.setUser(user);
  requestEnhance.enhance(readyCallback);

  return requestEnhance;
}

module.exports = newRequestEnhance;
