var Bookshelf = require('bookshelf').PG;
var Model = require('../model/_model.js');
var Collection = Bookshelf.Collection.extend({
  model: Model,
  through: function (Interim, foreignKey, otherKey) {
    var related = Bookshelf.Collection.prototype.through.call(this, Interim, foreignKey, otherKey);

    return related.query('whereNull', related.relatedData.throughTableName + '.deleted_at');
  },
  sync: function (options) {
    var tableName = this.tableName;
    var sync = Bookshelf.Collection.prototype.sync.apply(this, arguments);
    var superSelect = sync.select;

    sync.select = function (options) {
      sync.query.whereNull(tableName + '.deleted_at');

      return superSelect.call(sync);
    };

    return sync;
  }
});

module.exports = Collection;
