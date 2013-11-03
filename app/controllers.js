var blogController = require('./controller/blog');
var blogRssController = require('./controller/blog_rss');
var adminBlogController = require('./controller/admin_blog');
var adminTagController = require('./controller/admin_tag');
var adminCommentController = require('./controller/admin_comment');
var authController = require('./controller/auth');
var accountController = require('./controller/account');
var errorController = require('./controller/error');
var adminController = require('./controller/admin');

var newHTMLView = require('./view/html');
var newRSSView = require('./view/rss');

var newAdminSettingsController = require('./controller/admin_settings');
var newAdminCommentsController = require('./controller/admin_comment.js');
//var newApi10WebmentionController = require('./controller/api/1.0/webmention.js');

function init(app, done) {
  app.controller = {
    blog: blogController(newHTMLView(app.templates), app.store.post, app.store.tag, app.store.comment, app.stomp),
    blog_rss: blogRssController(newRSSView(), app.store.post),
    admin_blog: adminBlogController(newHTMLView(app.templates), app.store.post, app.store.tag, app.types, app.stomp),
    admin_tag: adminTagController(newHTMLView(app.templates), app.store.tag),
    admin_comment: adminCommentController(newHTMLView(app.templates), app.store.comment, app.types),
    auth: authController(newHTMLView(app.templates), app.idp, app.store.user),
    account: accountController(newHTMLView(app.templates), app.store.user),
    error: errorController(newHTMLView(app.templates)),
    admin: adminController(newHTMLView(app.templates), app.store.postActivity)
  };

  app.controller.admin_settings = newAdminSettingsController(newHTMLView(app.templates), app.events, app.config);
  //app.controller.webmention = newApi10WebmentionController(newHTMLView(app.templates), app.db.post, app.stomp);
  done();
}

module.exports = init;
