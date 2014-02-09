var User = require('../lib/models/user');
var Post = require('../lib/models/post');
var Tag = require('../lib/models/tag');
var Comment = require('../lib/models/comment.js');
var IdentityToken = require('../lib/models/identity_token.js');

function initModels(app, done) {
  app.model = {
    User: User,
    Post: Post,
    Tag: Tag,
    Comment: Comment,
    IdentityToken: IdentityToken
  };
  done();
}

module.exports = initModels;
