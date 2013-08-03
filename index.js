var net = require('net');
var repl = require('repl');
var http = require('http');
var initApp = require('./app');

Error.stackTraceLimit = Infinity;
initApp(function (err, app) {
  if (err) {
    console.error(err);
    return;
  }

  app.router.get('/', app.controller.blog.home);
  app.router.head('/', app.controller.blog.home);
  app.router.get('/posts/:slug', app.controller.blog.view);
  app.router.head('/posts/:slug', app.controller.blog.view);
  app.router.post('/posts/:slug', app.controller.blog.newCommentPost);
  app.router.get('/posts', app.controller.blog.index);
  app.router.head('/posts', app.controller.blog.index);
  app.router.get('/tags', app.controller.blog.tags);
  app.router.head('/tags', app.controller.blog.tags);
  app.router.get('/tags/:name', app.controller.blog.tag);
  app.router.head('/tags/:name', app.controller.blog.tag);
  app.router.get('/tags/:name/:page', app.controller.blog.tag);
  app.router.head('/tags/:name/:page', app.controller.blog.tag);
  app.router.get('/account/new', app.controller.account.new);
  app.router.head('/account/new', app.controller.account.new);
  app.router.post('/account/new', app.controller.account.postNew);
  app.router.all('/auth', app.controller.auth.index);
  app.router.get('/auth/with_google', app.controller.auth.withGoogle);
  app.router.head('/auth/with_google', app.controller.auth.withGoogle);
  app.router.get('/auth/google(\\?.*)?', app.controller.auth.google);
  app.router.head('/auth/google(\\?.*)?', app.controller.auth.google);
  app.router.get('/auth/with_github', app.controller.auth.withGithub);
  app.router.head('/auth/with_github', app.controller.auth.withGithub);
  app.router.all('/auth/github(\\?.*)?', app.controller.auth.github);
  app.router.head('/auth/github(\\?.*)?', app.controller.auth.github);
  app.router.get('/auth/with_facebook', app.controller.auth.withFacebook);
  app.router.head('/auth/with_facebook', app.controller.auth.withFacebook);
  app.router.all('/auth/facebook(\\?.*)?', app.controller.auth.facebook);
  app.router.head('/auth/facebook(\\?.*)?', app.controller.auth.facebook);
  app.router.get('/auth/logout', app.controller.auth.logout);
  app.router.get('/posts.rss', app.controller.blog_rss.posts);
  app.router.head('/posts.rss', app.controller.blog_rss.posts);
  app.router.get('/admin', app.controller.admin.index);
  app.router.head('/admin', app.controller.admin.index);
  app.router.all('/admin/posts', app.controller.admin_blog.index);
  app.router.head('/admin/posts', app.controller.admin_blog.index);
  app.router.get('/admin/posts/new', app.controller.admin_blog.new);
  app.router.head('/admin/posts/new', app.controller.admin_blog.new);
  app.router.post('/admin/posts/new', app.controller.admin_blog.newPost);
  app.router.get('/admin/posts/edit/:post_id', app.controller.admin_blog.edit);
  app.router.head('/admin/posts/edit/:post_id', app.controller.admin_blog.edit);
  app.router.post('/admin/posts/edit/:post_id', app.controller.admin_blog.editPost);
  app.router.get('/admin/posts/approve', app.controller.admin_blog.approveDashboard);
  app.router.head('/admin/posts/approve', app.controller.admin_blog.approveDashboard);
  app.router.get('/admin/posts/approve/:post_id', app.controller.admin_blog.approve);
  app.router.head('/admin/posts/approve/:post_id', app.controller.admin_blog.approve);
  app.router.post('/admin/posts/approve/:post_id', app.controller.admin_blog.approvePost);
  app.router.post('/admin/posts/delete', app.controller.admin_blog.delete);
  app.router.post('/admin/posts/confirm_delete', app.controller.admin_blog.confirmDelete);
  app.router.all('/admin/comments', app.controller.admin_comment.index);
  app.router.head('/admin/comments', app.controller.admin_comment.index);
  app.router.get('/admin/comments/approve/:comment_id', app.controller.admin_comment.approve);
  app.router.head('/admin/comments/approve/:comment_id', app.controller.admin_comment.approve);
  app.router.post('/admin/comments/approve/:comment_id', app.controller.admin_comment.approvePost);
  app.router.all('/admin/tags', app.controller.admin_tag.index);
  app.router.head('/admin/tags', app.controller.admin_tag.index);
  app.router.get('/admin/tags/new', app.controller.admin_tag.new);
  app.router.head('/admin/tags/new', app.controller.admin_tag.new);
  app.router.post('/admin/tags/new', app.controller.admin_tag.newPost);
  app.router.get('/admin/tags/edit/:tag_id', app.controller.admin_tag.edit);
  app.router.head('/admin/tags/edit/:tag_id', app.controller.admin_tag.edit);
  app.router.post('/admin/tags/edit/:tag_id', app.controller.admin_tag.editPost);
  app.router.post('/admin/tags/delete', app.controller.admin_tag.delete);
  app.router.post('/admin/tags/confirm_delete', app.controller.admin_tag.confirmDelete);
  app.router.get('/admin/settings', app.controller.admin_settings.index);
  app.router.head('/admin/settings', app.controller.admin_settings.index);
  app.router.get('/admin/settings/reload', app.controller.admin_settings.reload);
  app.router.head('/admin/settings/reload', app.controller.admin_settings.reload);
  app.router.post('/admin/settings/reload', app.controller.admin_settings.reloadPost);
  app.router.get('/admin/settings/general', app.controller.admin_settings.general);
  app.router.head('/admin/settings/general', app.controller.admin_settings.general);
  app.router.post('/admin/settings/general', app.controller.admin_settings.generalPost);
  app.router.handleError(404, app.controller.error.notFound);
  app.router.handleError(500, app.controller.error.internalServerError);
  app.router.handleError(400, app.controller.error.badRequest);
  app.router.handleError(403, app.controller.error.forbidden);

  http.createServer(app.router.requestListener()).listen(8106);

  net.createServer(function (socket) {
    repl.start({
      prompt: '> ',
      useColors: true,
      input: socket,
      output: socket
    }).on('exit', function () {
      socket.end();
    }).context.app = app;
  }).listen(5001);
});
