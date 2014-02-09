var ViewStream = require('http-view-stream');
var xtend = require('xtend');

function TemplateView(options) {
  if (!(this instanceof TemplateView)) {
    return new TemplateView(options);
  }

  ViewStream.prototype.call(this, options);
  options = options || {};
  this._templates = options.templates;
  this._writableState.objectMode = true;
  this._readableState.objectMode = false;
}

TemplateView.prototype = Object.create(ViewStream.prototype, {
  constructor: { value: TemplateView }
});

TemplateView.prototype._transform = function (chunk, encoding, done) {
  var data = xtend({}, req.view.context);
  var layout = this._templates['layout_' + (req.view.layout || 'default')];
  var content;

  data.config = req.config;
  data.csrf_token = req.session.uid();
  data.current_user = req.current_user;
  data.current_user_id = req.session.get('current_user_id');
  data.current_navigation = req.view.template;
  data.navigation = req.navigation;
  data.flash_message = req.session.get('flash_message');
  data.content = this._templates[req.view.template](data);

  if (!data.flash_message) {
    if (req.method !== 'HEAD') {
      this.push(layout(data));
    }

    done();
  }
  else {
    req.session.set('flash_message', null, function (err) {
      if (err) {
        this.emit('error', err);
      }
      else if (req.method !== 'HEAD') {
        this.push(layout(data));
      }

      done();
    }.bind(this));
  }
};

module.exports = TemplateView;
