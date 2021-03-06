var templateRoot = '../../handlebars';
var templates = {
  'layout_admin': require(templateRoot + '/templates/layout/admin.hbs'),
  'layout_default': require(templateRoot + '/templates/layout/default.hbs'),
  'layout_error': require(templateRoot + '/templates/layout/error.hbs'),
  'error_400': require(templateRoot + '/templates/error/400.hbs'),
  'error_403': require(templateRoot + '/templates/error/403.hbs'),
  'error_404': require(templateRoot + '/templates/error/404.hbs'),
  'error_500': require(templateRoot + '/templates/error/500.hbs'),
  'blog_home': require(templateRoot + '/templates/blog/home.hbs'),
  'blog_index': require(templateRoot + '/templates/blog/index.hbs'),
  'blog_tag': require(templateRoot + '/templates/blog/tag.hbs'),
  'blog_tags': require(templateRoot + '/templates/blog/tags.hbs'),
  'blog_view': require(templateRoot + '/templates/blog/view.hbs'),
  'account_new': require(templateRoot + '/templates/account/new.hbs'),
  'admin_index': require(templateRoot + '/templates/admin/index.hbs'),
  'admin_blog_approve': require(templateRoot + '/templates/admin/blog/approve.hbs'),
  'admin_blog_approve_post': require(templateRoot + '/templates/admin/blog/approve_post.hbs'),
  'admin_blog_delete': require(templateRoot + '/templates/admin/blog/delete.hbs'),
  'admin_blog_edit': require(templateRoot + '/templates/admin/blog/edit.hbs'),
  'admin_blog_index': require(templateRoot + '/templates/admin/blog/index.hbs'),
  'admin_blog_new': require(templateRoot + '/templates/admin/blog/new.hbs'),
  'admin_comments_approve': require(templateRoot + '/templates/admin/comments/approve.hbs'),
  'admin_comments_delete': require(templateRoot + '/templates/admin/comments/delete.hbs'),
  'admin_comments_edit': require(templateRoot + '/templates/admin/comments/edit.hbs'),
  'admin_comments_index': require(templateRoot + '/templates/admin/comments/index.hbs'),
  'admin_comments_new': require(templateRoot + '/templates/admin/comments/new.hbs'),
  'admin_settings_general': require(templateRoot + '/templates/admin/settings/general.hbs'),
  'admin_settings_index': require(templateRoot + '/templates/admin/settings/index.hbs'),
  'admin_settings_reload': require(templateRoot + '/templates/admin/settings/reload.hbs'),
  'admin_tags_delete': require(templateRoot + '/templates/admin/tags/delete.hbs'),
  'admin_tags_edit': require(templateRoot + '/templates/admin/tags/edit.hbs'),
  'admin_tags_index': require(templateRoot + '/templates/admin/tags/index.hbs'),
  'admin_tags_new': require(templateRoot + '/templates/admin/tags/new.hbs')
};

module.exports = templates;
