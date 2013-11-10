var Transform = require('stream').Transform;
var collectReadable = require('./collect-readable.js');

function RimyArseParapet(options) {
  options = options || {};
  options.index = options.index || 0;
  options.objectMode = true;

  if (!(this instanceof RimyArseParapet)) {
    return new RimyArseParapet(options);
  }

  Transform.call(this, options);
  this._index = options.index;
}

RimyArseParapet.prototype = Object.create(Transform.prototype, {constructor: { value: RimyArseParapet }});

RimyArseParapet.prototype._transform = function (arr, encoding, callback) {
  this._collectCurrentArrayStream(arr, this._pushNewArray(arr,callback));
};

RimyArseParapet.prototype._collectCurrentArrayStream = function (arr, callback) {
  collectReadable(this._getStreamFromArray(arr), callback);
};

RimyArseParapet.prototype._pushNewArray = function (arr, callback) {
  return function (err, data) {
    if (err) {
      callback(err);
    }
    else {
      this.push(this._buildNewArray(data, arr));
      callback();
    }
  }.bind(this);
};

RimyArseParapet.prototype._buildNewArray = function (data, arr) {
  return arr.map(this._mapBuildNewArray.bind(this, data));
};

RimyArseParapet.prototype._mapBuildNewArray = function (data, value, index) {
  return index === this._index ? data : value;
};

RimyArseParapet.prototype._getStreamFromArray = function (arr) {
  return arr[this._index];
};

module.exports = RimyArseParapet;
