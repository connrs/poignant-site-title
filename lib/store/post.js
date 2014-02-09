var slug = require('uslug');

function PostStore(pg) {
  if (!(this instanceof PostStore)) {
    return new PostStore(pg);
  }

  this._pg = pg;
}

PostStore.prototype.find = function (filters, callback) {
  if (filters.page !== undefined && filters.limit !== undefined) {
    this._count(filters, function (err, count) {
      if (err) {
        callback(err);
        return;
      }

      this._find(filters, function (err, posts) {
        if (err) {
          callback(err);
          return;
        }

        callback(null, {
          count: count,
          posts: posts
        });
      }.bind(this));
    }.bind(this));
  }
  else {
    this._find(filters, callback);
  }
};

PostStore.prototype.getUnapproved = function (callback) {
  this._pg.client(function (err, query) {
    if (err) {
      callback(err);
      return;
    }

    var sql = [];
    var params = [];

    sql.push('SELECT p.post_id, pst.post_status_type_id, p.title, p.summary, p.content, p.published, p.inserted, p.updated, p.slug,');
    sql.push('pst.name AS post_status,');
    sql.push('CASE WHEN ps.post_status_type_id IN(1,3) AND cp.post_id IS NULL THEN 1 ELSE NULL END AS can_edit,');
    sql.push('CASE WHEN ps.post_status_type_id IN(1,3) AND cp.post_id IS NULL THEN 1 ELSE NULL END AS can_delete,');
    sql.push('COALESCE(EXTRACT(EPOCH FROM p.updated),EXTRACT(EPOCH FROM p.published)) last_modified,');
    sql.push('EXTRACT(YEAR FROM p.published) published_year,');
    sql.push('prov.provider_id, pu.uid provider_user_uid,');
    sql.push('u.name author_name, u.url author_url');
    sql.push('FROM post p');
    sql.push('INNER JOIN post_status ps ON ps.post_id = p.post_id AND ps.deleted IS NULL AND ps.post_status_type_id IN(2,5)');
    sql.push('LEFT JOIN (');
    sql.push('SELECT p.parent_post_id, p.post_id');
    sql.push('FROM post p');
    sql.push('INNER JOIN post_status ps ON ps.post_id = p.post_id AND ps.deleted IS NULL AND ps.post_status_type_id = 5');
    sql.push('WHERE p.parent_post_id IS NOT NULL AND p.deleted IS NULL');
    sql.push(') cp ON cp.parent_post_id = p.post_id');
    sql.push('LEFT JOIN post_status_type pst ON pst.post_status_type_id = ps.post_status_type_id');
    sql.push('LEFT JOIN "user" u ON u.user_id = p.inserted_by');
    sql.push('LEFT JOIN provider_user pu ON pu.user_id = u.user_id AND pu.deleted IS NULL');
    sql.push('LEFT JOIN provider prov ON prov.provider_id = pu.provider_id AND prov.deleted IS NULL');
    sql.push('WHERE p.deleted IS NULL');
    sql.push('ORDER BY p.inserted DESC');
    query(sql.join('\n'), params, function (err, results) {
      if (err) {
        callback(err);
      }
      else {
        callback(null, results.rows);
      }
    });
  }.bind(this));
};

PostStore.prototype.update = function (data, callback) {
  this._pg.transaction(function (err, client) {
    if (err) {
      callback(err);
      return;
    }

    var sql = [];
    var params = [];
    var p = 0;

    sql.push('INSERT INTO post')
    sql.push('(parent_post_id, title, slug, summary, content, location, published, inserted, inserted_by)');
    sql.push('SELECT ');

    // Original Post ID
    sql.push('$' + ++p + ',');
    params.push(data.post_id);

    // Title
    if (data.title) {
      params.push(data.title);
      sql.push('$' + ++p + ',');
    }
    else {
      sql.push('NULL,');
    }

    // Slug
    sql.push('slug,');

    // Summary
    if (data.summary) {
      sql.push('$' + ++p + ',');
      params.push(data.summary);
    }
    else {
      sql.push('NULL,');
    }

    // Content
    sql.push('$' + ++p + ',');
    params.push(data.content);

    // Location
    if (data.hasOwnProperty('location_latitude') && data.hasOwnProperty('location_longitude')) {
      if (data.location_latitude === 'CLEAR' || data.location_longitude === 'CLEAR') {
        sql.push('NULL,');
      }
      else if (data.location_latitude === '' || data.location_longitude === '') {
        sql.push('NULL,');
      }
      else {
        sql.push('POINT($' + ++p + ', $' + ++p + '),');
        params.push(+data.location_latitude, +data.location_longitude);
      }
    }
    else {
        sql.push('location,');
    }

    //Published
    if (data.published_date && data.published_time) {
      sql.push('$' + ++p + ',');
      params.push(data.published_date + ' ' + data.published_time);
    }
    else {
      sql.push('published,');
    }

    //Inserted
    sql.push('NOW(),');

    //Inserted by
    sql.push('$' + ++p);
    params.push(data.by);

    sql.push('FROM post WHERE post_id = $' + ++p);
    params.push(data.post_id);
    sql.push('RETURNING post_id');
    client.query(sql.join('\n'), params, function (err, results, client) {
      var post_id;
      var sql = [];
      var params = [];

      if (err) {
        client.rollback(function (e) {
          callback(err);
        });
        return;
      }

      post_id = results.rows[0].post_id;
      sql.push('INSERT INTO post_status');
      sql.push('(post_id, post_status_type_id, inserted, inserted_by)');
      sql.push('VALUES($1, $2, $3, $4)');
      client.query(sql.join('\n'), [ post_id, 5, 'NOW()', data.by ], function (err, results, client) {
        if (err) {
          client.rollback(function (e) {
            callback(err);
          });
          return;
        }

        client.commit(function (err) {
          if (err) {
            callback(err);
            return;
          }

          callback(null, post_id);
        });
      }.bind(this));
    }.bind(this));
  }.bind(this));
};

PostStore.prototype.save = function (data, callback) {
  if (!data.post_id) {
    this._saveNew(data, callback);
  }
  else {
    this._save(data, callback);
  }
};

PostStore.prototype._saveNew = function (data, callback) {
  this._pg.transaction(function (err, client) {
    if (err) {
      callback(err);
      return;
    }

    this._generateSlug(client, data.title ? data.title : 'Status', function (err, slug, client) {
      if (err) {
        client.rollback(function () { callback(err); });
        return;
      }

      data.slug = slug;

      this._insertPost(client, data, function (err, result, client) {
        var statusData = {};

        if (err) {
          client.rollback(function () { callback(err); });
          return;
        }

        statusData.by = data.by;
        statusData.post_id = result.rows[0].post_id;

        if (data.post_status_type_id === 1) {
          statusData.post_status_type_id = 1;
        }
        else if (data.post_status_type_id === 2) {
          statusData.post_status_type_id = 2;
        }
        else {
          statusData.post_status_type_id = 3;
        }

        this._updateStatus(client, statusData, function (err, result, client) {
          if (err) {
            client.rollback(function() { callback(err); });
            return;
          }

          client.commit(function (err) {
            if (err) {
              callback(err);
            }
            else {
              callback(null, statusData.post_id);
            }
          });
        });
      }.bind(this));
    }.bind(this));
  }.bind(this));
};

PostStore.prototype._save = function (data, callback) {
  this._pg.transaction(function (err, client) {
    this._updatePost(client, data, function (err) {
      var statusData = {};

      if (err) {
        client.rollback(function () { callback(err); });
      }
      else if (data.post_status_type_id === 2) {
        statusData.by = data.by;
        statusData.post_id = data.post_id;
        statusData.post_status_type_id = 2;
        this._updateStatus(client, statusData, function (err) {
          if (err) {
            callback(err);
          }
          else {
            callback(null, data.post_id)
          }
        })
      }
      else {
        callback(null, data.post_id);
      }
    }.bind(this));
  }.bind(this));
};

PostStore.prototype._insertPost = function (client, data, callback) {
  var sql = [];
  var params = [];
  var p = 0;

  sql.push('INSERT INTO post')
  sql.push('(title, slug, summary, content, published, location, inserted, inserted_by)');
  sql.push('VALUES(');

  // Title
  if (data.title) {
    sql.push('$' + ++p + ',');
    params.push(data.title);
  }
  else {
    sql.push('NULL,');
  }

  // Slug
  sql.push('$' + ++p + ',');
  params.push(data.slug);

  // Summary
  if (data.summary) {
    sql.push('$' + ++p + ',');
    params.push(data.summary);
  }
  else {
    sql.push('NULL,');
  }

  // Content
  sql.push('$' + ++p + ',');
  params.push(data.content);

  //Published
  if (data.published_date && data.published_time) {
    sql.push('$' + ++p + ',');
    params.push(data.published_date + ' ' + data.published_time);
  }
  else {
    sql.push('NOW(),');
  }

  if (data.hasOwnProperty('location_latitude') && data.hasOwnProperty('location_longitude')) {
    if (data.location_latitude === 'CLEAR' || data.location_longitude === 'CLEAR') {
      sql.push('NULL,');
    }
    else if (data.location_latitude === '' || data.location_longitude === '') {
      sql.push('NULL,');
    }
    else {
      sql.push('POINT($' + ++p + ', $' + ++p + '),');
      params.push(+data.location_latitude, +data.location_longitude);
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
  sql.push('RETURNING post_id');

  client.query(sql.join('\n'), params, callback);
};

PostStore.prototype._updatePost = function (client, data, callback) {
  var sql = [];
  var params = [];
  var p = 0;

  sql.push('UPDATE post SET')

  // Title
  sql.push('title = $' + ++p + ',');
  params.push(data.title);

  // Summary
  if (data.summary) {
    sql.push('summary = $' + ++p + ',');
    params.push(data.summary);
  }
  else {
    sql.push('summary = NULL,');
  }

  // Content
  sql.push('content = $' + ++p + ',');
  params.push(data.content);

  //Published
  if (data.published_date && data.published_time) {
    sql.push('published = $' + ++p + ',');
    params.push(data.published_date + ' ' + data.published_time);
  }

  if (data.hasOwnProperty('location_latitude') && data.hasOwnProperty('location_longitude')) {
    if (data.location_latitude === 'CLEAR' || data.location_longitude === 'CLEAR') {
      sql.push('location = NULL,');
    }
    else if (data.location_latitude === '' || data.location_longitude === '') {
      sql.push('location = NULL,');
    }
    else {
      sql.push('location = POINT($' + ++p + ', $' + ++p + '),');
      params.push(+data.location_latitude, +data.location_longitude);
    }
  }

  //Inserted
  sql.push('updated = NOW(),');

  //Inserted by
  sql.push('updated_by = $' + ++p);
  params.push(data.by);

  //Which
  sql.push('WHERE post_id = $' + ++p);
  params.push(data.post_id);

  client.query(sql.join('\n'), params, callback);
};

PostStore.prototype.reject = function (data, callback) {
  this._pg.transaction(function (err, client) {
    if (err) {
      callback(err);
      return;
    }

    var postStatus = {
      post_id: data.post_id,
      by: data.by,
      post_status_type_id: 4
    }
    this._updateStatus(client, postStatus, function (err, results, client) {
      if (err) {
        client.rollback(function () { callback(err); });
      }
      else {
        client.commit(callback);
      }
    });
  }.bind(this));
};

PostStore.prototype.approve = function (data, callback) {
  this.find({post_id: data.post_id}, function (err, post) {
    if (err) {
      callback(err);
      return;
    }

    this._pg.transaction(function (err, client) {
      if (err) {
        callback(err);
        return
      }

      var postStatus = {
        post_id: data.post_id,
        by: data.by,
        post_status_type_id: 3
      };
      this._updateStatus(client, postStatus, function (err, results, client) {
        if (err) {
          client.rollback(function () { callback(err); });
          return;
        }

        if (!post.parent_post_id) {
          client.commit(callback);
          return;
        }

        var postStatus = {
          post_id: post.parent_post_id,
          by: data.by,
          post_status_type_id: 6
        };
        this._updateStatus(client, postStatus, function (err, results, client) {
          if (err) {
            client.rollback(function () { callback(err); });
          }
          else {
            client.commit(callback);
          }
        });
      }.bind(this));
    }.bind(this));
  }.bind(this));
};

PostStore.prototype.delete = function (data, callback) {
  this._pg.client(function (err, query) {
    var sql = [];
    var p = 0;
    var params = [];

    sql.push('UPDATE post SET');

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
    sql.push('AND post_id IN (' + data.post_id.map(function () { return '$' + ++p; }).join(',') + ')');
    params.push.apply(params, data.post_id);

    query(sql.join('\n'), params, function (err, result) {
      if (err) {
        callback(err);
        return;
      }

      callback();
    });
  }.bind(this))
};

PostStore.prototype._generateSlug = function (client, text, callback) {
  this._checkSlugUnique(client, slug(text), 0, callback);
};

PostStore.prototype._checkSlugUnique = function (client, slug, count, callback) {
  var query = 'SELECT post_id FROM post WHERE slug = $1';
  var check = slug;

  if (count > 0) {
    check += '-' + count;
  }

  client.query(query, [check], function (err, results, client) {
    if (err) {
      callback(err);
    }
    else if (results.rows.length === 0) {
      callback(null, check, client);
    }
    else {
      this._checkSlugUnique(client, slug, ++count, callback);
    }
  }.bind(this));
};

PostStore.prototype._updateStatus = function (client, data, callback) {
  var query = [];
  var params;

  query.push('UPDATE post_status SET');
  query.push('deleted = NOW(),');
  query.push('deleted_by = $1,');
  query.push('updated = NOW(),');
  query.push('updated_by = $2');
  query.push('WHERE post_id = $3 AND deleted IS NULL;');
  params = [ data.by, data.by, data.post_id ];
  client.query(query.join('\n'), params, function (err, result, client) {
    var query = [];
    var params;

    if (err) {
      callback(err, result, client);
    }
    else {
      query.push('INSERT INTO post_status');
      query.push('(post_id, post_status_type_id, inserted, inserted_by)');
      query.push('VALUES($1, $2, NOW(), $3);');
      params = [ data.post_id, data.post_status_type_id, data.by ];
      client.query(query.join('\n'), params, callback);
    }
  }.bind(this));
};

PostStore.prototype._savePostTags = function (data, callback) {
  var tagCount = data.tag_ids.length;
  var insertError = null;

  if (tagCount === 0) {
    callback(null, data.post_id);
  }
  else {
    data.tag_ids.forEach(function (tag_id) {
      var query = [], params = [], p = 0;

      if (!insertError) {
        query.push('INSERT INTO post_tag');
        query.push('(post_id, tag_id, inserted, inserted_by)');
        query.push('VALUES($1, $2, NOW(), $3)');
        params = [data.post_id, tag_id, data.by];
        this._client.query(query.join('\n'), params, function (err, result) {
          tagCount--;

          if (err) {
            insertError = err;
            callback(err);
          }
          else if (tagCount === 0) {
            callback(null, data.post_id);
          }
        }.bind(this));
      }
    }.bind(this));
  }
};

PostStore.prototype.getTags = function (post_id, callback) {
  var sql = [], params = [], p = 0;

  sql.push('SELECT t.name, t.pretty_name, t.content');
  sql.push('FROM post_tag pt');
  sql.push('INNER JOIN tag t ON t.tag_id = pt.tag_id AND t.deleted IS NULL');

  sql.push('WHERE pt.post_id = $' + ++p);
  params.push(post_id);

  sql.push('AND pt.deleted IS NULL');

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
          callback(null, result.rows);
        }
      }.bind(this));
    }
  }.bind(this));
};

PostStore.prototype._find = function (filters, callback) {
  this._pg.client(function (err, query) {
    if (err) {
      callback(err);
      return;
    }

    var sql = [];
    var p = 0;
    var params = [];

    sql.push('SELECT p.post_id, p.parent_post_id, pst.post_status_type_id, p.title, p.summary, p.content, p.published, p.inserted, p.updated, p.slug, p.inserted_by,');
    sql.push('pst.name post_status,');
    sql.push('CASE WHEN ps.post_status_type_id IN(1,3) AND cp.post_id IS NULL THEN 1 ELSE NULL END AS can_edit,');
    sql.push('CASE WHEN ps.post_status_type_id IN(1,3) AND cp.post_id IS NULL THEN 1 ELSE NULL END AS can_delete,');
    sql.push('CASE WHEN p.location IS NULL THEN NULL ELSE p.location[0] END AS location_latitude,');
    sql.push('CASE WHEN p.location IS NULL THEN NULL ELSE p.location[1] END AS location_longitude,');
    sql.push('COALESCE(EXTRACT(EPOCH FROM p.updated),EXTRACT(EPOCH FROM p.published)) last_modified,');
    sql.push('EXTRACT(YEAR FROM p.published) published_year,');
    sql.push('prov.provider_id, pu.uid provider_user_uid,');
    sql.push('u.name author_name, u.url author_url');
    sql.push('FROM post p');
    sql.push('INNER JOIN post_status ps ON ps.post_id = p.post_id AND ps.deleted IS NULL');

    if (+filters.post_status_type_id > 0) {
      sql.push('AND ps.post_status_type_id = $' + ++p);
      params.push(+filters.post_status_type_id);
    }

    sql.push('LEFT JOIN (');
    sql.push('SELECT p.parent_post_id, p.post_id');
    sql.push('FROM post p');
    sql.push('INNER JOIN post_status ps ON ps.post_id = p.post_id AND ps.deleted IS NULL AND ps.post_status_type_id = 5');
    sql.push('WHERE p.parent_post_id IS NOT NULL AND p.deleted IS NULL');
    sql.push(') cp ON cp.parent_post_id = p.post_id');
    sql.push('LEFT JOIN post_status_type pst ON pst.post_status_type_id = ps.post_status_type_id');
    sql.push('LEFT JOIN "user" u ON u.user_id = p.inserted_by');
    sql.push('LEFT JOIN provider_user pu ON pu.user_id = u.user_id AND pu.deleted IS NULL');
    sql.push('LEFT JOIN provider prov ON prov.provider_id = pu.provider_id AND prov.deleted IS NULL');

    if (filters.tag_id) {
      sql.push('INNER JOIN post_tag pt ON pt.post_id = p.post_id AND pt.deleted IS NULL AND pt.tag_id = $' + ++p);
      sql.push('INNER JOIN tag t ON t.tag_id = pt.tag_id AND t.deleted IS NULL');
      params.push(+filters.tag_id);
    }

    sql.push('WHERE p.deleted IS NULL');

    if (filters.title) {
      sql.push('AND p.title LIKE $' + ++p );
      params.push('%' + filters.title + '%');
    }

    if (filters.slug) {
      sql.push('AND p.slug = $' + ++p );
      params.push(filters.slug);
    }

    if (filters.post_id) {
      sql.push('AND p.post_id = $' + ++p );
      params.push(+filters.post_id);
    }

    sql.push('ORDER BY p.published DESC');

    if (filters.page !== undefined && filters.limit !== undefined) {
      sql.push('LIMIT $' + ++p + ' OFFSET $' + ++p);
      params.push(filters.limit, (filters.page - 1) * filters.limit);
    }
    else if (filters.limit !== undefined) {
      sql.push('LIMIT $' + ++p);
      params.push(filters.limit);
    }

    query(sql.join('\n'), params, function (err, results) {
      if (err) {
        callback(err);
      }
      else if (filters.post_id || filters.slug) {
        callback(null, results.rows[0]);
      }
      else {
        callback(null, results.rows);
      }
    });
  }.bind(this))
};

PostStore.prototype._count = function (filters, callback) {
  this._pg.client(function (err, query) {
    var sql = [];
    var p = 0;
    var params = [];

    sql.push('SELECT COUNT(p.post_id) count');
    sql.push('FROM post p');
    sql.push('INNER JOIN post_status ps ON ps.post_id = p.post_id AND ps.deleted IS NULL');

    if (+filters.post_status_type_id > 0) {
      sql.push('AND ps.post_status_type_id = $' + ++p);
      params.push(+filters.post_status_type_id);
    }

    sql.push('LEFT JOIN (');
    sql.push('SELECT p.parent_post_id, p.post_id');
    sql.push('FROM post p');
    sql.push('INNER JOIN post_status ps ON ps.post_id = p.post_id AND ps.deleted IS NULL AND ps.post_status_type_id = 5');
    sql.push('WHERE p.parent_post_id IS NOT NULL AND p.deleted IS NULL');
    sql.push(') cp ON cp.parent_post_id = p.post_id');
    sql.push('LEFT JOIN post_status_type pst ON pst.post_status_type_id = ps.post_status_type_id');
    sql.push('LEFT JOIN "user" u ON u.user_id = p.inserted_by');
    sql.push('LEFT JOIN provider_user pu ON pu.user_id = u.user_id AND pu.deleted IS NULL');
    sql.push('LEFT JOIN provider prov ON prov.provider_id = pu.provider_id AND prov.deleted IS NULL');

    if (filters.tag_id) {
      sql.push('INNER JOIN post_tag pt ON pt.post_id = p.post_id AND pt.deleted IS NULL');
      sql.push('INNER JOIN tag t ON t.tag_id = pt.tag_id AND t.deleted IS NULL AND t.tag_id = $' + ++p);
      params.push(+filters.tag_id);
    }

    sql.push('WHERE p.deleted IS NULL');

    if (filters.title) {
      sql.push('AND p.title LIKE $' + ++p );
      params.push('%' + filters.title + '%');
    }

    if (filters.slug) {
      sql.push('AND p.slug = $' + ++p );
      params.push(filters.slug);
    }

    if (filters.post_id) {
      sql.push('AND p.post_id = $' + ++p );
      params.push(+filters.post_id);
    }

    query(sql.join('\n'), params, function (err, results) {
      if (err) {
        callback(err);
      }
      else {
        callback(null, results.rows[0].count);
      }
    });
  }.bind(this));
};

function postStore(pg) {
  var store = new PostStore(pg);
  return store;
}

module.exports = postStore;
