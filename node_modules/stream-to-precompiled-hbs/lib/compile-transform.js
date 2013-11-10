var Transform = require('stream').Transform;

function CompileTransform(handlebars) {
  var options;

  if (!(this instanceof CompileTransform)) {
    return new CompileTransform(handlebars);
  }

  options = { objectMode: true };
  this._handlebars = handlebars;
  Transform.call(this, options);
}

CompileTransform.prototype = Object.create(Transform.prototype, { constructor: { value: CompileTransform } });

CompileTransform.prototype._transform = function (chunk, encoding, callback) {
  try {
    this.push([chunk[0], this._handlebars.compile(chunk[1].toString())]);
    callback();
  }
  catch (err) {
    callback(err);
  }
};

module.exports = CompileTransform;
