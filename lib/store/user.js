function UserStore(pg) {
  if (!(this instanceof UserStore)) {
    return new UserStore(pg);
  }

  this._pg = pg;
}

UserStore.prototype.find = function (filters, callback) {
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
        sql.push('INNER JOIN identity i ON i.user_id = u.user_id AND i.deleted_at IS NULL')
      }
      else {
        sql.push('INNER JOIN identity i ON i.user_id = u.user_id AND i.deleted_at IS NULL AND i.primary_identity');
      }
      sql.push('INNER JOIN provider p ON p.provider_id = i.provider_id AND p.deleted_at IS NULL');
      sql.push('LEFT JOIN admin_user au ON au.user_id = u.user_id AND au.deleted_at IS NULL');
      sql.push('LEFT JOIN "role" r ON r.role_id = au.role_id AND r.deleted_at is NULL');
      sql.push('WHERE u.deleted_at IS NULL');

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

UserStore.prototype.save = function (data, callback) {
  this._pg.transaction(function (err, client) {
    if (err) {
      callback(err);
    }
    else {
      var sql = [];
      var params = [ data.name, data.email, data.url, data.by ];

      sql.push('INSERT INTO "user"');
      sql.push('(name, email, url, inserted_at, inserted_by)');
      sql.push('VALUES ($1, $2, $3, NOW(), $4)');
      sql.push('RETURNING user_id');

      client.query(sql.join('\n'), params, function (err, results, client) {
        if (err) {
          client.rollback(callback);
        }
        else if (data.by === 0) {
          var id = results.rows[0].user_id;
          var sql = [];
          var params = [ id, id ]

          sql.push('UPDATE "user" SET');
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
    }
  });
};

UserStore.prototype.updateLastLogin = function (data, callback) {
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

UserStore.prototype._updateUser = function (data, callback) {
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

      // User ID
      sql.push('WHERE user_id = $' + ++p);
      params.push(data.user_id);

      query(sql.join('\n'), params, callback);
    }
  })
};

module.exports = UserStore;
