function hasOwnProperty(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

var Model = require('./_model.js');
var PostStatus = Model.extend({
  idAttribute: 'post_status_id',
  hasTimestamps: ['inserted_at', 'updated_at'],
  tableName: 'post_status',
  sync: function (options) {
    var sync = Model.prototype.sync.apply(this, arguments);
    var superInsert = sync.insert;

    sync.insert = function (options) {
      var post_id = options.post_id;
      var previous = new PostStatus({ post_id: post_id });

      return previous.fetch().then(function (model) {
        return !model ? this : model.destroy({ by: options.by });
      }).then(function () {
        return superInsert.call(sync, options);
      });
    };

    return sync;
  }
});

module.exports = PostStatus;
