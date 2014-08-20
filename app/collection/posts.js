var raw = require('bookshelf').PG.knex.raw;
var Collection = require('./_collection.js');
var Post = require('../model/post.js');
var PostCollection = Collection.extend({
  model: Post,
  tableName: 'post',
  idAttribute: 'post_id',
  sync: function (options) {
    var sync = Collection.prototype.sync.apply(this, arguments);
    var superSelect = sync.select;
    var postStatusTypeId = 3;

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
      query = query.whereNull('post.deleted_at');

      query = query.orderBy('post.published', 'DESC');

      return superSelect.call(sync);
    };

    return sync;
  }
});

PostCollection.getLatest = function (limit) {
  limit = limit || 3;
  return PostCollection.forge().query('limit', limit).fetch({ post_status_type_id: 3 });
};

PostCollection.count = function (options) {
  options = options || {};

  var collection = PostCollection.forge();
  var query = collection.query();
  var post_status_type_id;
  var tag_id;

  if (options.post_status_type_id) {
    post_status_type_id = options.post_status_type_id;
    delete options.post_status_type_id;
  }

  if (options.tag_id) {
    tag_id = options.tag_id;
    delete options.tag_id;
  }

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
  query = query.whereNull('post.deleted_at');

  return query.count('*').then(function (result) {
    if (!result || !result[0]) {
      return 0;
    }

    return result[0].count;
  });
};

module.exports = PostCollection;
