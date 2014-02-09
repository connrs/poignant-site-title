var xtend = require('xtend');
var Transform = require('stream').Transform;

function HTMLView(options) {
  options = options || {};

  if (!(this instanceof HTMLView)) {
    return new HTMLView(options);
  }

  Transform.call(this, options);
  this._templates = options.templates;
  this._layout = req.view.layout || 'default';
  this._data = xtend({
    config: req.config,
    csrf_token: req.session.uid(),
    current_user: req.current_user,
    current_user_id: req.session.get('current_user_id'),
    current_navigation: req.view.template,
    navigation: navigation,
    flash_message: req.session.get('flash_message'),
  }, req.view.context);
}

HTMLView.prototype = Object.create(Transform.prototype, { constructor: { value: HTMLView } });

HTMLView.prototype.render = function (req, res) {
  data.content = this._templates[req.view.template](data);
  res.setHeader('Content-Type', 'text/html; charset=utf-8')

  if (!data.flash_message) {
    if (req.method !== 'HEAD') {
      res.write(this._templates['layout_' + layout](data));
    }
    res.end();
  }
  else {
    req.session.set('flash_message', null, function (err) {
      if (req.method !== 'HEAD') {
        res.write(this._templates['layout_' + layout](data));
      }
      res.end();
    }.bind(this));
  }
};

module.exports = HTMLView;
