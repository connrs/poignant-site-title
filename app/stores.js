var postStore = require('../lib/store/post.js');
var tagStore = require('../lib/store/tag.js');
var commentStore = require('../lib/store/comment.js');
var userStore = require('../lib/store/user.js');
var postActivityStore = require('../lib/store/post_activity.js');
var identityTokenStore = require('../lib/store/identity_token.js');

function init(app, done) {
  app.store = {
    post: postStore(app.storeClient),
    tag: tagStore(app.storeClient),
    comment: commentStore(app.storeClient),
    user: userStore(app.storeClient),
    postActivity: postActivityStore(app.storeClient),
    identityToken: identityTokenStore(app.storeClient, app.env.secret)
  };
  done();
};

module.exports = init;
