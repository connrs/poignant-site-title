function UserData() {}

UserData.prototype.setClient = function (client) {
    this._client = client;
};

UserData.prototype.find = function (filters, callback) {
    var query = [];
    var params = [];
    var p = 0;
    query.push('SELECT u.user_id, i.identity_id, p.provider_id, p.name provider_name, i.uid identity_uid,');
    query.push('u.name, u.email, u.url, r.role_id, r.description role_description, r.name role_name');
    query.push('FROM "user" u');
    if (filters.uid) {
      query.push('INNER JOIN identity i ON i.user_id = u.user_id AND i.deleted IS NULL')
    }
    else {
      query.push('INNER JOIN identity i ON i.user_id = u.user_id AND i.deleted IS NULL AND i.primary_identity');
    }
    query.push('INNER JOIN provider p ON p.provider_id = i.provider_id AND p.deleted IS NULL');
    query.push('LEFT JOIN admin_user au ON au.user_id = u.user_id AND au.deleted IS NULL');
    query.push('LEFT JOIN "role" r ON r.role_id = au.role_id AND r.deleted is NULL');
    query.push('WHERE u.deleted IS NULL');

    if (filters.user_id) {
      query.push('AND u.user_id = $' + ++p);
      params.push(filters.user_id);
    }

    if (filters.uid) {
      query.push('AND i.uid = $' + ++p);
      params.push(filters.uid);
    }

    if (filters.provider_id) {
      query.push('AND i.provider_id = $' + ++p);
      params.push(filters.provider_id);
    }

    query.push('GROUP BY u.user_id, i.identity_id, p.provider_id, p.name, i.uid, u.name, u.email, u.url, r.role_id, r.description, r.name');

    this._client.query(query.join('\n'), params, function (err, results) {
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
};

UserData.prototype.findById = function (id, callback) {
    var query = [];
    query.push('SELECT u.user_id, pu.provider_user_id, p.provider_id, p.name provider_name, pu.uid provider_user_id,');
    query.push('u.name, u.email, u.url, r.role_id, r.description role_description, r.name role_name');
    query.push('FROM provider_user pu');
    query.push('INNER JOIN "user" u ON u.user_id = pu.user_id AND u.deleted IS NULL');
    query.push('INNER JOIN provider p ON p.provider_id = pu.provider_id AND p.deleted IS NULL');
    query.push('LEFT JOIN admin_user au ON au.user_id = u.user_id AND au.deleted IS NULL');
    query.push('LEFT JOIN "role" r ON r.role_id = au.role_id AND r.deleted is NULL');
    query.push('WHERE u.user_id = $1 AND pu.deleted IS NULL');
    this._client.query(query.join('\n'), [id], function (err, results) {
        if (err) {
            callback(err);
            return;
        }

        if (results.rows.length !== 1) {
            callback(null, null);
            return;
        }

        callback(null, results.rows[0]);
    });
};

UserData.prototype.findByProviderUid = function (providerUid, callback) {
    var query = [];
    query.push('SELECT u.user_id, pu.provider_user_id, p.provider_id, p.name provider_name, pu.uid provider_user_id,');
    query.push('u.name, u.email, u.url, r.role_id, r.description role_description, r.name role_name');
    query.push('FROM provider_user pu');
    query.push('INNER JOIN "user" u ON u.user_id = pu.user_id AND u.deleted IS NULL');
    query.push('INNER JOIN provider p ON p.provider_id = pu.provider_id AND p.deleted IS NULL');
    query.push('LEFT JOIN admin_user au ON au.user_id = u.user_id AND au.deleted IS NULL');
    query.push('LEFT JOIN "role" r ON r.role_id = au.role_id AND r.deleted is NULL');
    query.push('WHERE pu.uid = $1 AND pu.deleted IS NULL');
    this._client.query(query.join('\n'), [providerUid], function (err, results) {
        if (err) {
            callback(err);
            return;
        }

        if (results.rows.length !== 1) {
            callback(null, null);
            return;
        }

        callback(null, results.rows[0]);
    });
};

UserData.prototype.save = function (data, callback) {
  var userQ = [], userP = [];
  var updateUserQ = [], updateUserP = [];
  var providerUserQ = [], providerUserP = [];
  var identityQ = [], identityParams = [], identityP = 0;

  userQ.push('INSERT INTO "user"');
  userQ.push('(name, email, url, inserted, inserted_by)');
  userQ.push('VALUES ($1, $2, $3, NOW(), $4)');
  userQ.push('RETURNING user_id');
  userP.push(data.name, data.email, data.url, data.by);

  this._client.query(userQ.join(' '), userP, function (err, results) {
    var id;

    if (err) {
      callback(err);
    }
    else if (data.by === 0) {
      id = results.rows[0].user_id;
      updateUserQ.push('UPDATE "user" SET');
      updateUserQ.push('inserted_by = $1');
      updateUserQ.push('WHERE user_id = $2');
      updateUserP.push(id, id);
      this._client.query(updateUserQ.join(' '), updateUserP, function (err, result) {
        if (err) {
          callback(err);
          return;
        }

        providerUserQ.push('INSERT INTO identity');
        providerUserQ.push('(provider_id, user_id, uid, email, primary_identity, inserted, inserted_by)');
        providerUserQ.push('VALUES($1, $2, $3, $4, $5, NOW(), $6)');
        providerUserP.push(data.provider_id, id, data.uid, data.email, data.primary_identity ? '1' : '0', id);
        this._client.query(providerUserQ.join(' '), providerUserP, function (err, result) {
          if (err) {
            callback(err);
            return;
          }

          callback(null, id);
        }.bind(this));
      }.bind(this));
    }
    else {
      id = results.rows[0].user_id;
      providerUserQ.push('INSERT INTO identity');
      providerUserQ.push('(provider_id, user_id, uid, email, primary_identity, inserted, inserted_by)');
      providerUserQ.push('VALUES($1, $2, $3, $4, $5, NOW(), $6)');
      providerUserP.push(data.provider_id, id, data.uid, data.email, data.primary_identity ? '1' : '0', id);
      this._client.query(providerUserQ.join(' '), providerUserP, function (err, result) {
        if (err) {
          callback(err);
          return;
        }

        callback(null, id);
      }.bind(this));
    }
  }.bind(this));
};

UserData.prototype.updateLastLogin = function (data, callback) {
  var query = [];
  var params = [];
  var p = 0;

  query.push('INSERT INTO software_version_auth');
  query.push('(software_version_id, inserted, inserted_by)');
  query.push('VALUES($1, $2, $3)');
  params = [data.software_version_id, data.date, data.user_id];

  this._client.query(query.join('\n'), params, callback);
};

UserData.prototype._updateUser = function (data, callback) {
  var query = [];
  var params = [];
  var p = 0;

  // Update
  query.push('UPDATE user SET');

  // Name
  if (data.name) {
    query.push('name = $' + ++p + ',');
    params.push(data.name);
  }

  // Email
  if (data.email) {
    query.push('email = $' + ++p + ',');
    params.push(data.email);
  }

  // URL
  if (data.url) {
    query.push('url = $' + ++p + ',');
    params.push(data.url);
  }

  // User ID
  query.push('WHERE user_id = $' + ++p);
  params.push(data.user_id);

  this._client.query(query.join('\n'), params, callback);
};

function newUserData(client) {
  var userData = new UserData();
  userData.setClient(client);
  return userData;
}

module.exports = newUserData;
