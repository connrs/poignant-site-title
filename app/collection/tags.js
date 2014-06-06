var raw = require('bookshelf').PG.knex.raw;
var Collection = require('./_collection.js');
var Tag = require('../model/tag.js');
var Tags = Collection.extend({
  idAttribute: 'tag_id',
  model: Tag,
  tableName: 'tag',
  sync: function (options) {
    var sync = Collection.prototype.sync.apply(this, arguments)
    var superSelect = sync.select;

    sync.select = function () {
      var columns = [
        'tag.*',
        raw('published_post_tag.post_count'),
        raw('rank() OVER (ORDER BY published_post_tag.post_count)')
      ];
      var publishedPostTags = [
        '(',
          'SELECT COUNT(DISTINCT p.post_id) AS post_count, t.tag_id',
          'FROM post p',
          'INNER JOIN post_status ps ON ps.deleted_at IS NULL AND ps.post_id = p.post_id AND ps.post_status_type_id = 3',
          'INNER JOIN post_tag pt ON pt.deleted_at IS NULL AND pt.post_id = p.post_id',
          'INNER JOIN tag t ON t.deleted_at IS NULL AND t.tag_id = pt.tag_id',
          'WHERE p.deleted_at IS NULL',
          'GROUP BY t.tag_id',
        ') AS published_post_tag'
      ];
      var query;

      query = sync.query.column(columns);
      query = query.join(raw(publishedPostTags.join(' ')), function () {
        this.on('published_post_tag.tag_id','=','tag.tag_id');
      }, 'left');
      query = query.orderBy('tag.name');

      return superSelect.call(sync);
    };

    return sync;
  }
});

module.exports = Tags;
