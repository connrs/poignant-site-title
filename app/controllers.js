var newHTMLView = require('./view/html');
var newRSSView = require('./view/rss');
var newAccountController = require('./controller/account')
var newAuthController = require('./controller/auth');
var newBlogController = require('./controller/blog');
var newBlogRSSController = require('./controller/blog_rss');
var newAdminController = require('./controller/admin');
var newAdminBlogController = require('./controller/admin_blog');
var newAdminTagController = require('./controller/admin_tag.js');
var newErrorController = require('./controller/error');
var newAdminSettingsController = require('./controller/admin_settings');
var newAdminCommentsController = require('./controller/admin_comment.js');

function initControllers(app) {
    app.controller = {};
    app.controller.error = newErrorController(newHTMLView(app.templates));
    app.controller.account = newAccountController(newHTMLView(app.templates), app.model.User, app.db.user);
    app.controller.auth = newAuthController(newHTMLView(app.templates), app.providers, app.model.User, app.db.user);
    app.controller.blog = newBlogController(newHTMLView(app.templates), app.db.post, app.db.tag, app.db.comment);
    app.controller.blog_rss = newBlogRSSController(newRSSView(), app.db.post);
    app.controller.admin = newAdminController(newHTMLView(app.templates), app.db.post);
    app.controller.admin_blog = newAdminBlogController(newHTMLView(app.templates), app.model.Post, app.db.post, app.model.Tag, app.db.tag, app.types);
    app.controller.admin_tag = newAdminTagController(newHTMLView(app.templates), app.db.tag);
    app.controller.admin_settings = newAdminSettingsController(newHTMLView(app.templates), app.events, app.config);
    app.controller.admin_comment = newAdminCommentsController(newHTMLView(app.templates), app.db.comment, app.types);
}

module.exports = initControllers;
