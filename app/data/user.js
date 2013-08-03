function UserData() {}

UserData.prototype.setClient = function (client) {
    this._client = client;
};

UserData.prototype.findById = function (id, callback) {
    var query = [];
    query.push('SELECT u.user_id, pu.provider_user_id, p.provider_id, p.name provider_name, pu.uid provider_user_id,');
    query.push('u.name, u.email, r.role_id, r.description role_description, r.name role_name');
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
    query.push('u.name, u.email, r.role_id, r.description role_description, r.name role_name');
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

  userQ.push('INSERT INTO "user"');
  userQ.push('(name, email, inserted, inserted_by)');
  userQ.push('VALUES ($1, $2, NOW(), $3)');
  userQ.push('RETURNING user_id');
  userP.push(data.name, data.email, data.by);

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

        providerUserQ.push('INSERT INTO provider_user');
        providerUserQ.push('(provider_id, user_id, uid, inserted, inserted_by)');
        providerUserQ.push('VALUES($1, $2, $3, NOW(), $4)');
        providerUserP.push(data.provider_id, id, data.uid, id);
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
      providerUserQ.push('INSERT INTO provider_user');
      providerUserQ.push('(provider_id, user_id, uid, inserted, inserted_by)');
      providerUserQ.push('VALUES($1, $2, $3, NOW(), $4)');
      providerUserP.push(data.provider_id, id, data.uid, id);
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
