var blogController = require('../controller/blog.js');
var blogRssController = require('../controller/blog_rss.js');
var adminBlogController = require('../controller/admin_blog.js');
var adminTagController = require('../controller/admin_tag.js');
var adminCommentController = require('../controller/admin_comment.js');
var authController = require('../controller/auth.js');
var accountController = require('../controller/account.js');
var adminController = require('../controller/admin.js');
var adminSettingsController = require('../controller/admin_settings.js');
var testController = require('../controller/test.js');

//var newApi10WebmentionController = require('../controller/api/1.0/webmention.js');

function init(app, done) {
  app.controllers = [
    blogController(app.store.comment, app.stomp),
    blogRssController(app.store.post),
    adminBlogController(app.store.post, app.store.tag, app.types, app.stomp),
    adminTagController(app.store.tag),
    adminCommentController(app.store.comment, app.types),
    authController(app.idp, app.store),
    accountController(app.store.user),
    adminController(app.store.postActivity),
    adminSettingsController(app.events, app.config),
    testController()
  ];
  done();
}

module.exports = init;
