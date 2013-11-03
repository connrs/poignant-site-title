//var newUserData = require('./user.js');
//var newPostData = require('./post.js');
//var newTagData = require('./tag.js');
//var newCommentData = require('./comment.js');
var post = require('./post.js');

function init(app, done) {
  app.store = {
    post: post
  };
    //app.db.user = newUserData(app.dbClient);
    //app.db.post = newPostData(app.dbClient);
    //app.db.tag = newTagData(app.dbClient);
    //app.db.comment = newCommentData(app.dbClient);
  done();
}

module.exports = init;
