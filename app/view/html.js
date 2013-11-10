var xtend = require('xtend');

function HTMLView() {}

HTMLView.prototype.setTemplates = function (templates) {
  this._templates = templates;
};

HTMLView.prototype.render = function (req, res) {
  var data = xtend({}, req.view.context);
  var layout = req.view.layout || 'default';
  var content;

  data.config = req.config;
  data.csrf_token = req.session.uid();
  data.current_user = req.current_user;
  data.current_user_id = req.session.get('current_user_id');
  data.current_navigation = req.view.template;
  data.navigation = req.navigation;
  data.flash_message = req.session.get('flash_message');
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

function newHTMLView(templates) {
  var view = new HTMLView();
  view.setTemplates(templates);
  return view;
}

module.exports = newHTMLView;
