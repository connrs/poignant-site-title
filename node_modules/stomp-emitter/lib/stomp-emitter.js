"use strict";

var EventEmitter = require('events').EventEmitter;
var localFlag = /^~/;
var baseUri = '/queue/';

function StompEmitter(client, uid) {
  if (!(this instanceof StompEmitter)) {
    return new StompEmitter(client, uid);
  }

  if (typeof client === 'undefined') {
    throw new Error('No client provided to StompEmitter constructor');
  }

  if (typeof uid === 'undefined') {
    throw new Error('No UID provided to StompEmitter constructor');
  }

  EventEmitter.call(this);
  EventEmitter.prototype.addListener.call(this, 'removeListener', this._unsubscribeQueue.bind(this));
  this._client = client;
  this._uid = uid;
}

StompEmitter.prototype = Object.create(EventEmitter.prototype);
StompEmitter.prototype.constructor = EventEmitter;

StompEmitter.prototype.addListener = function (type, callback) {
  if (!this.listeners(type).length) {
    this._client.subscribe(this._queueUri(type), null, this._createStompListener(type));
  }

  EventEmitter.prototype.addListener.call(this, type, callback);

  return this;
};

StompEmitter.prototype.emit = function (type, body, headers) {
  if (type === 'removeListener') {
    EventEmitter.prototype.emit.apply(this, arguments);
  }
  else {
    this._client.publish(this._queueUri(type), body, headers);
  }

  return this;
};

StompEmitter.prototype.on = StompEmitter.prototype.addListener;

StompEmitter.prototype._unsubscribeQueue = function (type, listener) {
  if (!this.listeners(type).length) {
    this._client.unsubscribe(this._queueUri(type));
  }
};

StompEmitter.prototype._queueUri = function (event) {
  return baseUri + this._eventPath(event);
};

StompEmitter.prototype._eventPath = function (event) {
  return event.replace(localFlag, this._localFlagModifier());
};

StompEmitter.prototype._localFlagModifier = function () {
  return this._uid + '/';
};

StompEmitter.prototype._createStompListener = function (type) {
  return function (body, headers) {
    EventEmitter.prototype.emit.call(this, type, this._processStompData(body, headers));
  }.bind(this);
};

StompEmitter.prototype._processStompData = function (body, headers) {
  if (this._bodyIsJSON(headers)) {
    return this._processJSONBody(body);
  }

  return body;
};

StompEmitter.prototype._bodyIsJSON = function (headers) {
  return headers && headers['content-type'] && headers['content-type'].match(/^application\/json/);
};

StompEmitter.prototype._processJSONBody = function (body) {
  var jsonBody;

  try {
    jsonBody = JSON.parse(body);
  }
  catch (e) {
    jsonBody = body;
  }
  finally {
    return jsonBody;
  }
};

module.exports = StompEmitter;
