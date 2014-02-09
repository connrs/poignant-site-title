var crypto = require('crypto');

function IdentityTokenStore(pg, salt) {
  if (!(this instanceof IdentityTokenStore)) {
    return new IdentityTokenStore(pg, salt);
  }

  this._pg = pg;
  this._salt = salt;
}

IdentityTokenStore.prototype.find = function (filters, callback) {
  this._pg.client(function (err, query) {
    if (err) {
      callback(err);
    }
    else {
      var sql = [];
      var params = [];
      var p = 0;
      sql.push('SELECT u.user_id, i.identity_id, p.provider_id, p.name provider_name, i.uid identity_uid,');
      sql.push('u.name, u.email, u.url, r.role_id, r.description role_description, r.name role_name');
      sql.push('FROM "user" u');
      if (filters.uid) {
        sql.push('INNER JOIN identity i ON i.user_id = u.user_id AND i.deleted IS NULL')
      }
      else {
        sql.push('INNER JOIN identity i ON i.user_id = u.user_id AND i.deleted IS NULL AND i.primary_identity');
      }
      sql.push('INNER JOIN provider p ON p.provider_id = i.provider_id AND p.deleted IS NULL');
      sql.push('LEFT JOIN admin_user au ON au.user_id = u.user_id AND au.deleted IS NULL');
      sql.push('LEFT JOIN "role" r ON r.role_id = au.role_id AND r.deleted is NULL');
      sql.push('WHERE u.deleted IS NULL');

      if (filters.user_id) {
        sql.push('AND u.user_id = $' + ++p);
        params.push(filters.user_id);
      }

      if (filters.uid) {
        sql.push('AND i.uid = $' + ++p);
        params.push(filters.uid);
      }

      if (filters.provider_id) {
        sql.push('AND i.provider_id = $' + ++p);
        params.push(filters.provider_id);
      }

      sql.push('GROUP BY u.user_id, i.identity_id, p.provider_id, p.name, i.uid, u.name, u.email, u.url, r.role_id, r.description, r.name');

      query(sql.join('\n'), params, function (err, results) {
        if (err) {
          callback(err);
        }
        else if (filters.user_id || filters.uid) {
          callback(null, results.rows[0]);
        }
        else {
          callback(null, results.rows);
        }
      });
    }
  });
};

IdentityTokenStore.prototype.save = function (data, callback) {
  this._pg.transaction(function (err, client) {
    var sql = [];
    var params = [];
    var p = 0;
    var cipher;

    if (err) {
      callback(err);
    }
    else {
      cipher = crypto.createCipher('AES-256-CBC', this._salt);
      data.token = '\\x' +  cipher.update(data.token, 'utf8', 'hex') + cipher.final('hex');
      sql.push('INSERT INTO identity_token');
      sql.push('(identity_id, identity_token_type_id, token, inserted, inserted_by)');
      sql.push('VALUES(');

      // Identity ID
      sql.push('$' + ++p + ',');
      params.push(data.identity_id);

      // ID Token Type ID
      sql.push('$' + ++p + ',');
      params.push(data.identity_token_type_id);

      // Token
      sql.push('$' + ++p + ',');
      params.push(data.token);

      // Inserted date
      sql.push('NOW(),');

      // Inserted by
      sql.push('$' + ++p);
      params.push(data.user_id);

      sql.push(')');
      client.query(sql.join('\n'), params, function (err, results, client) {
        if (err) {
          client.rollback(function () {
            callback(err);
          });
        }
        else {
          client.commit(callback);
        }
      });
    }
  }.bind(this));
};

module.exports = IdentityTokenStore;
