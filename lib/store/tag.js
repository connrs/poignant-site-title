var slug = require('uslug');

function TagStore(pg) {
  if (!(this instanceof TagStore)) {
    return new TagStore(pg);
  }

  this._pg = pg;
}

TagStore.prototype.find = function (filters, callback) {
  var sql = [];
  var p = 0;
  var params = [];

  if (filters.post_count) {
    sql.push('SELECT s.*, rank() OVER (ORDER BY s.post_count) AS rank');
    sql.push('FROM (');
  }

  sql.push('SELECT t.tag_id, t.name, t.pretty_name, t.content,');
  sql.push('COUNT(p.post_id) post_count,');
  sql.push('t.inserted, t.inserted_by,');
  sql.push('u.name user_name');
  sql.push('FROM tag t');
  sql.push('LEFT JOIN "user" u ON u.user_id = t.inserted_by');
  sql.push('LEFT JOIN post_tag pt ON pt.tag_id = t.tag_id AND pt.deleted IS NULL');
  sql.push('LEFT JOIN published_post p ON p.post_id = pt.post_id');
  sql.push('WHERE t.deleted IS NULL');

  if (filters.name) {
    sql.push('AND t.name = $' + ++p);
    params.push(filters.name);
  }

  if (filters.tag_id) {
    sql.push('AND t.tag_id = $' + ++p);
    params.push(filters.tag_id);
  }

  sql.push('GROUP BY t.tag_id, t.name, t.pretty_name, u.name');

  if (filters.post_count) {
    sql.push('HAVING COUNT(p.post_id) > 0');
  }

  sql.push('ORDER BY t.name');

  if (filters.post_count) {
    sql.push(') AS s');
    sql.push('ORDER BY s.name');
  }

  this._pg.client(function (err, query) {
    if (err) {
      callback(err);
    }
    else {
      query(sql.join('\n'), params, function (err, results) {
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
    }
  }.bind(this));
};

TagStore.prototype.save = function (data, callback) {
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

TagStore.prototype._insertTag = function (data, callback) {
  var sql = [];
  var params = [];
  var p = 0;

  sql.push('INSERT INTO tag')
  sql.push('(name, pretty_name, content, inserted, inserted_by)');
  sql.push('VALUES(');

  // Name
  sql.push('$' + ++p + ',');
  params.push((data.name + '').toLowerCase());

  // Summary
  if (data.hasOwnProperty('pretty_name')) {
    if (data.pretty_name === null || data.pretty_name === undefined || data.pretty_name === '') {
      sql.push('NULL,');
    }
    else {
      sql.push('$' + ++p + ',');
      params.push(data.pretty_name);
    }
  }
  else {
    sql.push('NULL,');
  }

  // Content
  if (data.hasOwnProperty('content')) {
    if (data.content === null || data.content === undefined || data.content === '') {
      sql.push('NULL,');
    }
    else {
      sql.push('$' + ++p + ',');
      params.push(data.content);
    }
  }
  else {
    sql.push('NULL,');
  }

  //Inserted
  sql.push('NOW(),');

  //Inserted by
  sql.push('$' + ++p);
  params.push(data.by);

  sql.push(')');
  sql.push('RETURNING tag_id');

  this._pg.client(function (err, query) {
    if (err) {
      callback(err);
    }
    else {
      query(sql.join('\n'), params, callback);
    }
  });
};

TagStore.prototype._updateTag = function (data, callback) {
  var sql = [];
  var params = [];
  var p = 0;

  sql.push('UPDATE tag SET')

  // Summary
  if (data.hasOwnProperty('pretty_name')) {
    if (data.pretty_name === null || data.pretty_name === undefined || data.pretty_name === '') {
      sql.push('pretty_name = NULL,');
    }
    else {
      sql.push('pretty_name = $' + ++p + ',');
      params.push(data.pretty_name);
    }
  }

  // Content
  if (data.hasOwnProperty('content')) {
    if (data.content === null || data.content === undefined || data.content === '') {
      sql.push('content = NULL,');
    }
    else {
      sql.push('content = $' + ++p + ',');
      params.push(data.content);
    }
  }

  //Updated
  sql.push('updated = NOW(),');

  //Updated by
  sql.push('updated_by = $' + ++p);
  params.push(data.by);

  //Which
  sql.push('WHERE tag_id = $' + ++p);
  params.push(data.tag_id);

  this._pg.client(function (err, query) {
    if (err) {
      callback(err);
    }
    else {
      query(sql.join('\n'), params, callback);
    }
  });
};

TagStore.prototype.delete = function (data, callback) {
  var sql = [];
  var p = 0;
  var params = [];

  sql.push('UPDATE tag SET');

  // Deleted
  sql.push('deleted = NOW(),');

  // Deleted By
  sql.push('deleted_by = $' + ++p + ',');
  params.push(data.by);

  // Updated
  sql.push('updated = NOW(),');

  // Updated By
  sql.push('updated_by = $' + ++p);
  params.push(data.by);

  // Post ID
  sql.push('WHERE deleted IS NULL');
  sql.push('AND tag_id IN (' + data.tag_id.map(function () { return '$' + ++p; }).join(',') + ')');
  params.push.apply(params, data.tag_id);

  this._pg.client(function (err, query) {
    if (err) {
      callback(err);
    }
    else {
      query(sql.join('\n'), params, function (err, result) {
        if (err) {
          callback(err);
        }
        else {
          callback();
        }
      });
    }
  });
};

module.exports = TagStore;
