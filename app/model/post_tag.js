function hasOwnProperty(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

var lazyRelations = {};
var Model = require('./_model.js');
var PostTag = Model.extend({
  post: function () {
    return this.belongsTo(lazyRelations.Post, 'post_id');
  },
  tag: function () {
    return this.belongsTo(lazyRelations.Tag, 'tag_id');
  },
  idAttribute: 'post_tag_id',
  hasTimestamps: ['inserted_at', 'updated_at'],
  tableName: 'post_tag'
});

module.exports = PostTag;
lazyRelations.Post = require('./post.js');
lazyRelations.Tag = require('./tag.js');
