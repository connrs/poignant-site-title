var Transform = require('stream').Transform;
var Template = require('app/templates/index.js');

function TemplateStream(options) {
  options = options || {};
  options.objectMode = true;

  Transform.call(this, options);

  this._layout = options.layout;
  this._viewTemplate = options.viewTemplate;
}

TemplateStream.prototype = Object.create(Transform.prototype, { constructor: { value: Transform } });

TemplateStream.prototype._transform = function (obj, enc, done) {
  try {
    var template = new Template(obj, this._layout);
    obj.output = template.generate(this._viewTemplate, obj.context);
    done(null, obj);
  }
  catch (e) {
    done(e);
  }
};

function templateStream(options) {
  return new TemplateStream(options);
}

module.exports = templateStream;
