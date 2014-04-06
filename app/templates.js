var xtend = require('xtend');
var handlebars = require('handlebars');
var templateRoot = '../templates/';
var partials = {
  'admin_foot_assets': require(templateRoot + 'partials/admin/foot_assets.hbs'),
  'admin_head_assets': require(templateRoot + 'partials/admin/head_assets.hbs'),
  'admin_sidebar': require(templateRoot + 'partials/admin/sidebar.hbs'),
  'post_info': require(templateRoot + 'partials/post/info.hbs'),
  'flash_message_alert': require(templateRoot + 'partials/flash_message_alert.hbs'),
  'foot_assets': require(templateRoot + 'partials/foot_assets.hbs'),
  'head_assets': require(templateRoot + 'partials/head_assets.hbs'),
  'logged_in': require(templateRoot + 'partials/logged_in.hbs'),
  'sidebar': require(templateRoot + 'partials/sidebar.hbs'),
  'validation_errors': require(templateRoot + 'partials/validation_errors.hbs')
};
var templates = {
  'layout_admin': require(templateRoot + 'templates/layout/admin.hbs'),
  'layout_default': require(templateRoot + 'templates/layout/default.hbs'),
  'error_400': require(templateRoot + 'templates/error/400.hbs'),
  'error_403': require(templateRoot + 'templates/error/403.hbs'),
  'error_404': require(templateRoot + 'templates/error/404.hbs'),
  'error_500': require(templateRoot + 'templates/error/500.hbs'),
  'blog_home': require(templateRoot + 'templates/blog/home.hbs'),
  'blog_index': require(templateRoot + 'templates/blog/index.hbs'),
  'blog_tag': require(templateRoot + 'templates/blog/tag.hbs'),
  'blog_tags': require(templateRoot + 'templates/blog/tags.hbs'),
  'blog_view': require(templateRoot + 'templates/blog/view.hbs'),
  'account_new': require(templateRoot + 'templates/account/new.hbs'),
  'admin_index': require(templateRoot + 'templates/admin/index.hbs'),
  'admin_blog_approve': require(templateRoot + 'templates/admin/blog/approve.hbs'),
  'admin_blog_approve_post': require(templateRoot + 'templates/admin/blog/approve_post.hbs'),
  'admin_blog_delete': require(templateRoot + 'templates/admin/blog/delete.hbs'),
  'admin_blog_edit': require(templateRoot + 'templates/admin/blog/edit.hbs'),
  'admin_blog_index': require(templateRoot + 'templates/admin/blog/index.hbs'),
  'admin_blog_new': require(templateRoot + 'templates/admin/blog/new.hbs'),
  'admin_comments_approve': require(templateRoot + 'templates/admin/comments/approve.hbs'),
  'admin_comments_delete': require(templateRoot + 'templates/admin/comments/delete.hbs'),
  'admin_comments_edit': require(templateRoot + 'templates/admin/comments/edit.hbs'),
  'admin_comments_index': require(templateRoot + 'templates/admin/comments/index.hbs'),
  'admin_comments_new': require(templateRoot + 'templates/admin/comments/new.hbs'),
  'admin_settings_general': require(templateRoot + 'templates/admin/settings/general.hbs'),
  'admin_settings_index': require(templateRoot + 'templates/admin/settings/index.hbs'),
  'admin_settings_reload': require(templateRoot + 'templates/admin/settings/reload.hbs'),
  'admin_tags_delete': require(templateRoot + 'templates/admin/tags/delete.hbs'),
  'admin_tags_edit': require(templateRoot + 'templates/admin/tags/edit.hbs'),
  'admin_tags_index': require(templateRoot + 'templates/admin/tags/index.hbs'),
  'admin_tags_new': require(templateRoot + 'templates/admin/tags/new.hbs')
};
var helpers = [
  require('../lib/helper/handlebars/date.js'),
  require('../lib/helper/handlebars/markdown.js'),
  require('../lib/helper/handlebars/each_keys.js'),
  require('../lib/helper/handlebars/blog.js'),
  require('../lib/helper/handlebars/general.js')
];

function initHandlebarsHelpers(handlebars) {
  return function (helpersFunc) {
    helpersFunc(handlebars);
  };
}

function registerPartials(partials, handlebars) {
  return function (name) {
    handlebars.registerPartial(name, partials[name]);
  };
}

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

  if (obj.session && obj.session.get) {
    data.flash_message = this._obj.session.get('flash_message');
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

helpers.forEach(initHandlebarsHelpers(handlebars));
Object.keys(partials).forEach(registerPartials(partials, handlebars));

module.exports = Template;
