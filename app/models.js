var User = require('../lib/models/user');
var Post = require('../lib/models/post');
var Tag = require('../lib/models/tag');
var Comment = require('../lib/models/comment.js');

function initModels(app, done) {
  app.model = {
    User: User,
    Post: Post,
    Tag: Tag,
    Comment: Comment
  };
  done();
}

module.exports = initModels;
