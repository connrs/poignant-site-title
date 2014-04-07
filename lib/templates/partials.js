var templateRoot = '../../handlebars';
var partials = {
  'admin_foot_assets': require(templateRoot + '/partials/admin/foot_assets.hbs'),
  'admin_head_assets': require(templateRoot + '/partials/admin/head_assets.hbs'),
  'admin_sidebar': require(templateRoot + '/partials/admin/sidebar.hbs'),
  'post_info': require(templateRoot + '/partials/post/info.hbs'),
  'flash_message_alert': require(templateRoot + '/partials/flash_message_alert.hbs'),
  'foot_assets': require(templateRoot + '/partials/foot_assets.hbs'),
  'head_assets': require(templateRoot + '/partials/head_assets.hbs'),
  'logged_in': require(templateRoot + '/partials/logged_in.hbs'),
  'sidebar': require(templateRoot + '/partials/sidebar.hbs'),
  'validation_errors': require(templateRoot + '/partials/validation_errors.hbs')
};

function registerPartials(partials, handlebars) {
  return function (name) {
    handlebars.registerPartial(name, partials[name]);
  };
}


module.exports = function init(handlebars) {
  Object.keys(partials).forEach(registerPartials(partials, handlebars));
};
