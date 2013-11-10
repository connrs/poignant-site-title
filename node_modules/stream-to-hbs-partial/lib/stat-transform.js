var Transform = require('stream').Transform;
var fs = require('fs');
var matchExtension = '.hbs';
var matchLeadingDotSlash = /^\.\//;
var matchNonAlphaNumerics = /[^A-Za-z0-9]+/g;

function StatTransform(options) {
  options = options || {};

  if (!(this instanceof StatTransform)) {
    return new StatTransform(options);
  }

  options.objectMode = true;
  Transform.call(this, options);
}

StatTransform.prototype = Object.create(Transform.prototype, { constructor: { value: StatTransform } });

StatTransform.prototype._transform = function (chunk, encoding, callback) {
  if (chunk.isFile()) {
    this.push(this._statToArray(chunk));
  }
  callback();
};

StatTransform.prototype._statToArray = function (stat) {
  return [this._pathToSlug(stat.path), fs.createReadStream(stat.fullPath)];
};

StatTransform.prototype._pathToSlug = function (path) {
  return path.replace(matchExtension, '').replace(matchLeadingDotSlash, '').replace(matchNonAlphaNumerics, '_');
};

module.exports = StatTransform;
