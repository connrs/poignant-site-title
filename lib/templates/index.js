var handlebars = require('handlebars');
var initPartials = require('./partials.js');
var initHelpers = require('./helpers.js');
var templates = require('./templates.js');
var xtend = require('xtend');

initPartials(handlebars);
initHelpers(handlebars);

function Template(obj, layout) {
  this._obj = obj;
  this._layout = layout;
}

Template.prototype.generate = function (name, context) {
  var template = this._getTemplate();
  return template(name, context);
};

Template.prototype._getTemplate = function () {
  var data = {};
  var layout = templates['layout_' + this._layout];
  var obj = this._obj;

  if (obj.config) {
    data.config = this._obj.config;
  }

  if (obj.session && obj.session.uid) {
    data.csrf_token = this._obj.session.uid();
  }

  if (obj.current_user) {
    data.current_user = this._obj.current_user;
  }

  if (obj.session && obj.session.get) {
    data.current_user_id = this._obj.session.get('current_user_id');
  }

  if (obj.navigation) {
    data.navigation = this._obj.navigation;
  }

  if (obj.flash_message) {
    data.flash_message = obj.flash_message;
  }

  if (obj.formErrors) {
    data.formErrors = obj.formErrors;
  }

  return function (name, context) {
    var template = templates[name];
    data = xtend(data, context);
    data.content = template(data);
    return layout(data);
  };
};

module.exports = Template;
