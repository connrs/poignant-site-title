var StandingData = require('../model/standing_data.js');

function storeSave(store, model) {
  return function () {
    store.save(model.toJSON());
  };
}

function StandingDataStore(pg) {
  if (!(this instanceof StandingDataStore)) {
    return new StandingDataStore(pg);
  }

  this._pg = pg;
}

StandingDataStore.prototype.new = function () {
  var model = new StandingData();

  model.save = storeSave(store, model);

  return model;
};

StandingDataStore.prototype.find = function (filters, callback) {
  var store = this;
  this._pg.client(function (err, query) {
    if (err) { return callback(err); }

    var sql = [];
    var params = [];
    var p = 0;
    
    sql.push('SELECT key, value');
    sql.push('FROM standing_data');
    sql.push('WHERE deleted_at IS NULL');

    if (filters.key) {
      sql.push('AND key = $' + ++p);
    }

    query(sql.join('\n'), params, function (err, results) {
      if (err) {
        callback(err);
      }
      else if (filters.key) {
        callback(null, initWithStore(store, results.rows[0]));
      }
      else {
        callback(null, results.rows.map(this._initModelWithData.bind(this)));
      }
    }.bind(this));
  }.bind(this));
};

StandingDataStore.prototype.save = function (data, callback) {
  this._pg.transaction(function (err, client) {
    if (err) { return callback(err); }

    var sql = [];
    var params = [ data.key, data.value, data.by ];

    sql.push('INSERT INTO "standing_data"');
    sql.push('(key, value, inserted_at, inserted_by)');
    sql.push('VALUES ($1, $2, NOW(), $3)');
    sql.push('RETURNING standing_data_id');

    client.query(sql.join('\n'), params, function (err, results, client) {
      if (err) {
        client.rollback(callback);
      }
      else if (data.by === 0) {
        var id = results.rows[0].user_id;
        var sql = [];
        var params = [ id, id ]

        sql.push('UPDATE "standing_data" SET');
        sql.push('inserted_by = $1');
        sql.push('WHERE user_id = $2');
        client.query(sql.join('\n'), params, function (err, results, client) {
          if (err) {
            client.rollback(callback);
          }
          else {
            var sql = [];
            var params = [];

            sql.push('INSERT INTO identity');
            sql.push('(provider_id, user_id, uid, email, primary_identity, inserted_at, inserted_by)');
            sql.push('VALUES($1, $2, $3, $4, $5, NOW(), $6)');
            params.push(data.provider_id, id, data.uid, data.email, data.primary_identity ? '1' : '0', id);
            client.query(sql.join('\n'), params, function (err, results, client) {
              if (err) {
                client.rollback(callback);
              }
              else {
                client.commit(function (err) {
                  if (err) {
                    callback(err);
                  }
                  else {
                    callback(null, id);
                  }
                });
              }
            });
          }
        });
      }
      else {
        var id = results.rows[0].user_id;
        var sql = [];
        var params = [];

        sql.push('INSERT INTO identity');
        sql.push('(provider_id, user_id, uid, email, primary_identity, inserted_at, inserted_by)');
        sql.push('VALUES($1, $2, $3, $4, $5, NOW(), $6)');
        params.push(data.provider_id, id, data.uid, data.email, data.primary_identity ? '1' : '0', id);
        client.query(sql.join('\n'), params, function (err, results, client) {
          if (err) {
            client.rollback(callback);
          }
          else {
            client.commit(function (err) {
              if (err) {
                callback(err);
              }
              else {
                callback(null, id);
              }
            });
          }
        });
      }
    });
  });
};

StandingDataStore.prototype.updateLastLogin = function (data, callback) {
  this._pg.client(function (err, query) {
    if (err) {
      callback(err);
    }
    else {
      var sql = [];
      var params = [];
      var p = 0;

      sql.push('INSERT INTO software_version_auth');
      sql.push('(software_version_id, inserted_at, inserted_by)');
      sql.push('VALUES($1, $2, $3)');
      params = [data.software_version_id, data.date, data.user_id];

      query(sql.join('\n'), params, callback);
    }
  });
};

StandingDataStore.prototype._updateStandingData = function (data, callback) {
  this._pg.client(function (err, query) {
    if (err) {
      callback(err);
    }
    else {
      var sql = [];
      var params = [];
      var p = 0;

      // Update
      sql.push('UPDATE user SET');

      // Name
      if (data.name) {
        sql.push('name = $' + ++p + ',');
        params.push(data.name);
      }

      // Email
      if (data.email) {
        sql.push('email = $' + ++p + ',');
        params.push(data.email);
      }

      // URL
      if (data.url) {
        sql.push('url = $' + ++p + ',');
        params.push(data.url);
      }

      // StandingData ID
      sql.push('WHERE user_id = $' + ++p);
      params.push(data.user_id);

      query(sql.join('\n'), params, callback);
    }
  })
};

StandingDataStore.prototype._initModelWithData = function (data) {
  var model = new StandingData();

  model.setData(model);
  model.save = storeSave(store, model);

  return model;
};

module.exports = StandingDataStore;
