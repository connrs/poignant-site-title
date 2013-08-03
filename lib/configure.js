var xtend = require('xtend');

function dotsToObject(o, d, value) {

  var dots = d.split('.');
  var length = dots.length;
  dots.reduce(function (r, v, i) {
    if (i === length) {
      r = value;
    }
    else {
      r[v] = {};
      return r[v];
    }
  }, o);
}

function Config() {}

Config.prototype.init = function (data) {
  this._data = xtend({}, data);
};

Config.prototype.set = function (key, value) {
    this._processDots(key, value);
};

Config.prototype.get = function () {
    return this._data;
};

Config.prototype._processDots = function(key, value) {
    var dots = key.split('.');
    var length = dots.length;
    var data = this._data;

    dots.reduce(function (r, v, i) {
        r[v] = r[v] || {};

        if (i === length - 1) {
            r[v] = value;
        }

        return r[v];
    }, data);
};

function newConfig(init) {
    var config = new Config();
    config.init(init);
    return config;
}

module.exports = newConfig;
