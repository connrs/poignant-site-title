var newUserData = require('./user.js');
var newPostData = require('./post.js');
var newTagData = require('./tag.js');
var newCommentData = require('./comment.js');

function initData(app, callback) {
    app.db = {};
    app.db.user = newUserData(app.dbClient);
    app.db.post = newPostData(app.dbClient);
    app.db.tag = newTagData(app.dbClient);
    app.db.comment = newCommentData(app.dbClient);
    callback();
}

module.exports = initData;
