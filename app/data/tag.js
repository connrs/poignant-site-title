var slug = require('uslug');

function TagData() {}

TagData.prototype.setClient = function (client) {
  this._client = client;
};

TagData.prototype.find = function (filters, callback) {
  var query = [];
  var p = 0;
  var params = [];

  if (filters.post_count) {
    query.push('SELECT s.*, rank() OVER (ORDER BY s.post_count) AS rank');
    query.push('FROM (');
  }

  query.push('SELECT t.tag_id, t.name, t.pretty_name, t.content,');
  query.push('COUNT(p.post_id) post_count,');
  query.push('t.inserted, t.inserted_by,');
  query.push('u.name user_name');
  query.push('FROM tag t');
  query.push('LEFT JOIN "user" u ON u.user_id = t.inserted_by');
  query.push('LEFT JOIN post_tag pt ON pt.tag_id = t.tag_id AND pt.deleted IS NULL');
  query.push('LEFT JOIN published_post p ON p.post_id = pt.post_id');
  query.push('WHERE t.deleted IS NULL');

  if (filters.name) {
    query.push('AND t.name = $' + ++p);
    params.push(filters.name);
  }

  if (filters.tag_id) {
    query.push('AND t.tag_id = $' + ++p);
    params.push(filters.tag_id);
  }

  query.push('GROUP BY t.tag_id, t.name, t.pretty_name, u.name');

  if (filters.post_count) {
    query.push('HAVING COUNT(p.post_id) > 0');
  }

  query.push('ORDER BY t.name');

  if (filters.post_count) {
    query.push(') AS s');
    query.push('ORDER BY s.name');
  }

  this._client.query(query.join('\n'), params, function (err, results) {
    if (err) {
      callback(err);
    }
    else if (!results.rows) {
      callback();
    }
    else if (filters.tag_id || filters.name) {
      callback(null, results.rows[0]);
    }
    else {
      callback(null, results.rows);
    }
  });
};

TagData.prototype.save = function (data, callback) {
  if (data.tag_id) {
    this._updateTag(data, callback);
  }
  else {
    this._insertTag(data, function (err, result) {
      if (err) {
        callback(err);
      }
      else if (!result.rows) {
        callback();
      }
      else {
        this.find({tag_id: result.rows[0].tag_id}, callback);
      }
    }.bind(this));
  }
};

TagData.prototype._insertTag = function (data, callback) {
  var query = [];
  var params = [];
  var p = 0;

  query.push('INSERT INTO tag')
  query.push('(name, pretty_name, content, inserted, inserted_by)');
  query.push('VALUES(');

  // Name
  query.push('$' + ++p + ',');
  params.push((data.name + '').toLowerCase());

  // Summary
  if (data.hasOwnProperty('pretty_name')) {
    if (data.pretty_name === null || data.pretty_name === undefined || data.pretty_name === '') {
      query.push('NULL,');
    }
    else {
      query.push('$' + ++p + ',');
      params.push(data.pretty_name);
    }
  }
  else {
    query.push('NULL,');
  }

  // Content
  if (data.hasOwnProperty('content')) {
    if (data.content === null || data.content === undefined || data.content === '') {
      query.push('NULL,');
    }
    else {
      query.push('$' + ++p + ',');
      params.push(data.content);
    }
  }
  else {
    query.push('NULL,');
  }

  //Inserted
  query.push('NOW(),');

  //Inserted by
  query.push('$' + ++p);
  params.push(data.by);

  query.push(')');
  query.push('RETURNING tag_id');

  this._client.query(query.join('\n'), params, callback);
};

TagData.prototype._updateTag = function (data, callback) {
  var query = [];
  var params = [];
  var p = 0;

  query.push('UPDATE tag SET')

  // Summary
  if (data.hasOwnProperty('pretty_name')) {
    if (data.pretty_name === null || data.pretty_name === undefined || data.pretty_name === '') {
      query.push('pretty_name = NULL,');
    }
    else {
      query.push('pretty_name = $' + ++p + ',');
      params.push(data.pretty_name);
    }
  }

  // Content
  if (data.hasOwnProperty('content')) {
    if (data.content === null || data.content === undefined || data.content === '') {
      query.push('content = NULL,');
    }
    else {
      query.push('content = $' + ++p + ',');
      params.push(data.content);
    }
  }

  //Updated
  query.push('updated = NOW(),');

  //Updated by
  query.push('updated_by = $' + ++p);
  params.push(data.by);

  //Which
  query.push('WHERE tag_id = $' + ++p);
  params.push(data.tag_id);

  this._client.query(query.join('\n'), params, callback);
};

TagData.prototype.delete = function (data, callback) {
  var query = [];
  var p = 0;
  var params = [];

  query.push('UPDATE tag SET');

  // Deleted
  query.push('deleted = NOW(),');

  // Deleted By
  query.push('deleted_by = $' + ++p + ',');
  params.push(data.by);

  // Updated
  query.push('updated = NOW(),');

  // Updated By
  query.push('updated_by = $' + ++p);
  params.push(data.by);

  // Post ID
  query.push('WHERE deleted IS NULL');
  query.push('AND tag_id IN (' + data.tag_id.map(function () { return '$' + ++p; }).join(',') + ')');
  params.push.apply(params, data.tag_id);

  this._client.query(query.join('\n'), params, function (err, result) {
    if (err) {
      callback(err);
      return;
    }

    callback();
  });
};

TagData.prototype._rollback = function (callback) {
  this._client.query('ROLLBACK', callback);
};

TagData.prototype._commit = function (callback) {
  this._client.query('COMMIT', callback);
};

function newTagData(client) {
  var tagData = new TagData();
  tagData.setClient(client);
  return tagData;
}

module.exports = newTagData;
