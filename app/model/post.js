function hasOwnProperty(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

var lazyRelations = {};
var raw = require('bookshelf').PG.knex.raw;
var Model = require('./_model.js');
var Post = Model.extend({
  comments: function () {
    return this.belongsToMany(lazyRelations.Comments, 'comment_post', 'post_id', 'comment_id');
  },
  tags: function () {
    return this.belongsToMany(lazyRelations.Tags).through(lazyRelations.PostTag, 'post_id', 'tag_id');
  },
  postStatus: function () {
    return this.hasOne(lazyRelations.PostStatus, 'post_id');
  },
  attachPostStatus: function (options) {
    return function (post) {
      return post.related('postStatus').save(options).yield(post);
    };
  },
  idAttribute: 'post_id',
  hasTimestamps: ['inserted_at', 'updated_at'],
  tableName: 'post',
  format: function (attrs) {
    attrs = Model.prototype.format.call(this, attrs);

    if (hasOwnProperty(attrs, 'location') && Array.isArray(attrs.location)) {
        attrs.location = raw('POINT(' + attrs.location[0] + ', ' + attrs.location[1] + ')');
    }

    return attrs;
  },
  sync: function (options) {
    var sync = Model.prototype.sync.apply(this, arguments);
    var superSelect = sync.select;

    sync.select = function (options) {
      var columns = [
        'post.post_id', 'post.parent_post_id', 'post_status.post_status_type_id', 'post.title', 'post.summary', 'post.content', 'post.published', 'post.inserted_at', 'post.updated_at', 'post.slug', 'post.inserted_by', 'post_status_type.name AS post_status',
        raw('CASE WHEN post_status.post_status_type_id IN (1,3) AND child_post.post_id IS NULL THEN 1 ELSE NULL END AS can_edit'),
        raw('CASE WHEN post_status.post_status_type_id IN(1,3) AND child_post.post_id IS NULL THEN 1 ELSE NULL END AS can_delete'),
        raw('CASE WHEN post.location IS NULL THEN NULL ELSE post.location[0] END AS location_latitude'),
        raw('CASE WHEN post.location IS NULL THEN NULL ELSE post.location[1] END AS location_longitude'),
        raw('COALESCE(EXTRACT(EPOCH FROM post.updated_at), EXTRACT(EPOCH FROM post.published)) AS last_modified'),
        raw('EXTRACT(YEAR FROM post.published) AS published_year'),
        'user.name AS author_name',
        'user.url AS author_url'
      ];
      var post_status_type_id;
      var tag_id;
      var query;

      if (sync.options.post_status_type_id) {
        post_status_type_id = sync.options.post_status_type_id;
        delete sync.options.post_status_type_id;
      }

      if (sync.options.tag_id) {
        tag_id = sync.options.tag_id;
        delete sync.options.tag_id;
      }

      query = sync.query.column(columns);
      query = query.join('post_status', function () {
        this.on('post_status.post_id', '=', 'post.post_id');

        if (post_status_type_id !== undefined) {
          this.on('post_status.post_status_type_id', '=', post_status_type_id);
        }
      }, 'inner');
      query = query.join('post_status_type', function () {
        this.on('post_status_type.post_status_type_id', '=', 'post_status.post_status_type_id');
      }, 'left');
      query = query.join(raw('(SELECT p.parent_post_id, p.post_id FROM post p INNER JOIN post_status ps ON ps.post_id = p.post_id AND ps.deleted_at IS NULL AND ps.post_status_type_id = 5 WHERE p.parent_post_id IS NOT NULL AND p.deleted_at IS NULL) AS child_post'), 'child_post.parent_post_id', '=', 'post.post_id', 'LEFT');
      query = query.join('user', function () {
        this.on('user.user_id', '=', 'post.inserted_by');
      }, 'left');

      if (tag_id !== undefined) {
        query = query.join('post_tag', function () {
          this.on('post_tag.post_id', '=', 'post.post_id');
          this.on('post_tag.tag_id', '=', tag_id);
        }, 'inner');
        query = query.join('tag', function () {
          this.on('tag.tag_id', '=', 'post_tag.tag_id');
        }, 'inner');
        query = query.whereNull('post_tag.deleted_at');
        query = query.whereNull('tag.deleted_at');
      }

      query = query.whereNull('post_status.deleted_at');

      query = query.orderBy('post.published', 'DESC');

      return superSelect.call(sync);
    };

    return sync;
  }
});

module.exports = Post;

lazyRelations.Tags = require('../collection/tags.js');
lazyRelations.Comments = require('../collection/comments.js');
lazyRelations.PostTag = require('./post_tag.js');
lazyRelations.PostStatus = require('./post_status.js');
