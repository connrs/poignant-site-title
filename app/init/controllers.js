var blogController = require('../controller/blog.js');
var blogRssController = require('../controller/blog_rss.js');
var adminBlogController = require('../controller/admin_blog.js');
var adminTagController = require('../controller/admin_tag.js');
var adminCommentController = require('../controller/admin_comment.js');
var authController = require('../controller/auth.js');
var accountController = require('../controller/account.js');
var adminController = require('../controller/admin.js');
var adminSettingsController = require('../controller/admin_settings.js');

//var newApi10WebmentionController = require('../controller/api/1.0/webmention.js');

function init(app, done) {
  app.controller = {
    blog: blogController(app.store.post, app.store.tag, app.store.comment, app.stomp),
    blog_rss: blogRssController(app.store.post),
    admin_blog: adminBlogController(app.store.post, app.store.tag, app.types, app.stomp),
    admin_tag: adminTagController(app.store.tag),
    admin_comment: adminCommentController(app.store.comment, app.types),
    auth: authController(app.idp, app.store),
    account: accountController(app.store.user),
    admin: adminController(app.store.postActivity),
    admin_settings: adminSettingsController(app.events, app.config)
  };
  done();
}

module.exports = init;
