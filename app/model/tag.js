function hasOwnProperty(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

var lazyRelations = {};
var raw = require('bookshelf').PG.knex.raw;
var Model = require('./_model.js');
var Tag = Model.extend({
  idAttribute: 'tag_id',
  hasTimestamps: ['inserted_at', 'updated_at'],
  tableName: 'tag',
  posts: function () {
    return this.belongsToMany(lazyRelations.Posts).through(lazyRelations.PostTag, 'tag_id', 'post_id');
  }
});

Tag.postCount = function (options) {
  options = options || {};

  return function (tag) {
    if (!tag) { return null; }

    options.tag_id = tag.id;

    var post_status_type_id = options.post_status_type_id || null;
    var tag_id = options.tag_id || null;
    var query = lazyRelations.Posts.forge().query();

    query = query.count('*');
    query = query.join('post_status', function () {
      this.on('post_status.post_id', '=', 'post.post_id');

      if (post_status_type_id !== undefined) {
        this.on('post_status.post_status_type_id', '=', post_status_type_id);
      }
    }, 'inner');

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

    return query.then(function (result) {
      if (!result || !result[0]) {
        tag.set('post_count', 0);
      }

      tag.set('post_count', result[0].count);
    }).yield(tag);
  }
};

module.exports = Tag;
lazyRelations.Posts = require('../collection/posts.js');
lazyRelations.PostTag = require('./post_tag.js');
