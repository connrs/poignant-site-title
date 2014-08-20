function hasOwnProperty(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

var Bookshelf = require('bookshelf').PG;
var Model = Bookshelf.Model.extend({
  through: function (Interim, foreignKey, otherKey) {
    var related = Bookshelf.Model.prototype.through.call(this, Interim, foreignKey, otherKey);

    return related.query('whereNull', related.relatedData.throughTableName + '.deleted_at');
  },
  format: function (attrs) {
    if (hasOwnProperty(attrs, 'by')) {
      if (this.isNew()) {
        attrs.inserted_by = attrs.by;
      }

      attrs.updated_by = attrs.by;
      delete attrs.by;
    }

    return attrs;
  },
  sync: function (options) {
    var tableName = this.tableName;
    var sync = Bookshelf.Model.prototype.sync.apply(this, arguments);
    var superSelect = sync.select;

    sync.select = function (options) {
      sync.query.whereNull(tableName + '.deleted_at');

      return superSelect.call(sync);
    };
    sync.del = function () {
      return sync.update.call(sync, { by: sync.options.by, deleted_at: new Date(), deleted_by: sync.options.by });
    };

    return sync;
  }
});

module.exports = Model;
