function hasOwnProperty(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

var Model = require('./_model.js');
var CommentStatus = Model.extend({
  idAttribute: 'comment_status_id',
  hasTimestamps: ['inserted_at', 'updated_at'],
  tableName: 'comment_status',
  sync: function (options) {
    var sync = Model.prototype.sync.apply(this, arguments);
    var superInsert = sync.insert;

    sync.insert = function (options) {
      var comment_id = options.comment_id;
      var previous = new CommentStatus({ comment_id: comment_id });

      return previous.fetch().then(function (model) {
        return !model ? this : model.destroy({ by: options.by });
      }).then(function () {
        return superInsert.call(sync, options);
      });
    };

    return sync;
  }
});

module.exports = CommentStatus;
