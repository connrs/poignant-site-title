function hasOwnProperty(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

var lazyRelations = {};
var raw = require('bookshelf').PG.knex.raw;
var Model = require('./_model.js');
var Comment = Model.extend({
  commentStatus: function () {
    return this.hasOne(lazyRelations.CommentStatus, 'comment_id');
  },
  attachCommentStatus: function (options) {
    return function (comment) {
      return comment.related('commentStatus').save(options).yield(comment);
    };
  },
  idAttribute: 'comment_id',
  hasTimestamps: ['inserted_at', 'updated_at'],
  tableName: 'comment',
  sync: function (options) {
    var sync = Model.prototype.sync.apply(this, arguments);
    var superSelect = sync.select;

    sync.select = function (options) {
      var columns = [
        'comment.comment_id', 'comment.comment_type_id', 'comment.content', 'comment.url',
        'comment.inserted_by', 'comment.inserted_at', 'comment_type.name AS comment_type',
        'comment_status.comment_status_type_id', 'comment_status_type.name AS comment_status_type',
        'user.name AS user_name', 'user.user_id',
        raw('CASE WHEN comment_status.comment_status_type_id = 2 THEN 1 ELSE NULL END AS can_delete')
      ];
      var comment_status_type_id;
      var query;

      if (sync.options.comment_status_type_id) {
        comment_status_type_id = sync.options.comment_status_type_id;
        delete sync.options.comment_status_type_id;
      }
      else {
        comment_status_type_id = 2;
      }

      query = sync.query.column(columns);
      query = query.join('comment_status', function() {
        this.on('comment_status.comment_id', '=', 'comment.comment_id');

        if (comment_status_type_id !== undefined) {
          this.on('comment_status.comment_status_type_id', '=', comment_status_type_id);
        }
      }, 'inner');
      query = query.join('comment_status_type', function () {
        this.on('comment_status_type.comment_status_type_id', '=', 'comment_status.comment_status_type_id');
      });
      query = query.join('comment_type', function () {
        this.on('comment_type.comment_type_id', '=', 'comment.comment_type_id');
      }, 'inner');
      query = query.join('user', function () {
        this.on('user.user_id', '=', 'comment.inserted_by');
      }, 'inner');
      query = query.whereNull('comment_status.deleted_at');
      query = query.whereNull('user.deleted_at');

      return superSelect.call(sync);
    };

    return sync;
  }
});

module.exports = Comment;
lazyRelations.CommentStatus = require('./comment_status.js');
