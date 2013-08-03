function PostgresqlStore(opts) {
  this._opts = opts || {};

  if (!this._opts.hasOwnProperty('table')) {
    this._opts.table = 'session';
  }

  this._client = this._opts.client;
}

PostgresqlStore.prototype.add = function (uid) {
  var meta = null;
  var data = {};
  var cb = null;
  var success = false;
  var i;
  var query = [];

  for (i = 1; i < arguments.length; i++) {
    if (typeof arguments[i] === 'function') {
      cb = arguments[i];
    }
    else if (typeof arguments[i] === 'object') {
      if (meta === null) {
        meta = arguments[i];
      }
      else {
        data = arguments[i];
      }
    }
  }

  if (meta === null) {
    meta = {};
  }

  query.push('INSERT INTO "' + this._opts.table + '"');
  query.push('(uid, meta, data, last_used)');
  query.push('VALUES($1, $2, $3, NOW())');
  this._client.query(query.join('\n'), [uid, JSON.stringify(meta), JSON.stringify(data)], function (err) {
    if (err) {
      cb(err);
      return;
    }

    cb(null, meta, data);
  });

  return this;
};

PostgresqlStore.prototype.uids = function (cb) {
  var query = [];

  query.push('SELECT s.uid');
  query.push('FROM "' + this._opts.table + '" s');
  query.push('INNER JOIN standing_data sd ON sd.key = \'session.max_age\' AND sd.deleted IS NULL AND (sd.value = \'0\' OR EXTRACT(EPOCH FROM NOW() - s.last_used) < CAST(sd.value AS DOUBLE PRECISION))');
  query.push('WHERE s.deleted IS NULL');
  this._client.query(query.join('\n'), function (err, results) {
    if (err) {
      cb(err);
      return;
    }

    var keys = [];
    for (var i = 0; i < results.rows.length; i++) {
      keys.push(results.rows[i].uid);
    }

    return cb(null, keys);
  });

  return this;
};

PostgresqlStore.prototype.set = function (uid, meta, data, cb) {
  var db = this.db, t = this._opts.table;
  var query = [];

  query.push('SELECT s.*');
  query.push('FROM "' + this._opts.table + '" s');
  query.push('INNER JOIN standing_data sd ON sd.key = \'session.max_age\' AND sd.deleted IS NULL AND (sd.value = \'0\' OR EXTRACT(EPOCH FROM NOW() - s.last_used) < CAST(sd.value AS DOUBLE PRECISION))');
  query.push('WHERE s.deleted IS NULL AND s.uid = $1');

  this._client.query(query.join('\n'), [uid], function (err, results) {
    var sessions;
    var query = [];
    if (err || !results.rows.length) {
      typeof cb == "function" && cb(new Error("uid not found"));
      return;
    }

    sessions = results.rows;

    try {
      sessions[0].meta = JSON.parse(sessions[0].meta);
    } catch (e) {
      sessions[0].meta = {};
    }
    try {
      sessions[0].data = JSON.parse(sessions[0].data);
    } catch (e) {
      sessions[0].data = {};
    }

    for (k in meta) {
      sessions[0].meta[k] = meta[k];
    }
    for (k in data) {
      sessions[0].data[k] = data[k];
    }

    query.push('UPDATE "' + this._opts.table + '" SET');
    query.push('data = $1,');
    query.push('meta = $2');
    query.push('WHERE uid = $3');
    this._client.query(query.join('\n'), [JSON.stringify(sessions[0].data), JSON.stringify(sessions[0].meta), uid], function (err) {
       if (err) {
         console.log(err);
         typeof cb == "function" && cb(new Error("Could not save new meta/data"));
         return;
       }

       typeof cb == "function" && cb(null);
     }.bind(this));
  }.bind(this));

  return this;
};

PostgresqlStore.prototype.get = function (uid) {
  var key = null;
  var cb = null;
  var query = [];

  for (var i = 1; i < arguments.length; i++) {
    if (typeof arguments[i] === 'string') {
      key = arguments[i];
    }
    else if (typeof arguments[i] === 'function') {
      cb = arguments[i];
    }
  }

  if (cb === null) {
    throw new Error("missing callback");
  }

  query.push('SELECT s.*');
  query.push('FROM "' + this._opts.table + '" s');
  query.push('INNER JOIN standing_data sd ON sd.key = \'session.max_age\' AND sd.deleted IS NULL AND (sd.value = \'0\' OR EXTRACT(EPOCH FROM NOW() - s.last_used) < CAST(sd.value AS DOUBLE PRECISION))');
  query.push('WHERE s.uid = $1 AND s.deleted IS NULL');

  this._client.query(query.join('\n'), [uid], function (err, results) {
    var sessions;

    if (err || !results.rows.length) {
      cb(new Error("uid not found"));
      return;
    }

    sessions = results.rows;

    try {
      sessions[0].meta = JSON.parse(sessions[0].meta);
    } catch (e) {
      sessions[0].meta = {};
    }
    try {
      sessions[0].data = JSON.parse(sessions[0].data);
    } catch (e) {
      sessions[0].data = {};
    }

    if (key === null) {
      return cb(null, sessions[0].meta, sessions[0].data);
    }

    return cb(null, sessions[0].data.hasOwnProperty(key) ? sessions[0].data[key] : null);
  });

  return this;
};

PostgresqlStore.prototype.remove = function () {
  var items = Array.prototype.slice.apply(arguments);
  var uid = items.shift();
  var cb = items.pop();
  var query = [];

  query.push('UPDATE ' + this._opts.table + ' SET');
  query.push('meta = \'\',');
  query.push('data = \'\',');
  query.push('deleted = NOW()');
  query.push('WHERE uid = $1 AND deleted IS NULL');

  this._client.query(query.join('\n'), [uid], function (err) {
    cb(null);
  });

  return this;
};

module.exports = PostgresqlStore;
