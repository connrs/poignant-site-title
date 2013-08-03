var slug = require('uslug');

function PostData() {}

PostData.prototype.setClient = function (client) {
  this._client = client;
};

PostData.prototype.find = function (filters, callback) {
  var query = [];
  var p = 0;
  var params = [];

  query.push('SELECT p.post_id, pst.post_status_type_id, p.title, p.summary, p.content, p.published, p.inserted, p.updated, p.slug,');
  query.push('pst.name post_status,');
  query.push('CASE WHEN ps.post_status_type_id IN(1,3) AND cp.post_id IS NULL THEN 1 ELSE NULL END AS can_edit,');
  query.push('CASE WHEN ps.post_status_type_id IN(1,3) AND cp.post_id IS NULL THEN 1 ELSE NULL END AS can_delete,');
  query.push('COALESCE(EXTRACT(EPOCH FROM p.updated),EXTRACT(EPOCH FROM p.published)) last_modified,');
  query.push('EXTRACT(YEAR FROM p.published) published_year,');
  query.push('prov.provider_id, pu.uid provider_user_uid,');
  query.push('u.name author_name');
  query.push('FROM post p');
  query.push('INNER JOIN post_status ps ON ps.post_id = p.post_id AND ps.deleted IS NULL');

  if (+filters.post_status_type_id > 0) {
    query.push('AND ps.post_status_type_id = $' + ++p);
    params.push(+filters.post_status_type_id);
  }

  query.push('LEFT JOIN (');
    query.push('SELECT p.parent_post_id, p.post_id');
    query.push('FROM post p');
    query.push('INNER JOIN post_status ps ON ps.post_id = p.post_id AND ps.deleted IS NULL AND ps.post_status_type_id = 5');
    query.push('WHERE p.parent_post_id IS NOT NULL AND p.deleted IS NULL');
  query.push(') cp ON cp.parent_post_id = p.post_id');
  query.push('LEFT JOIN post_status_type pst ON pst.post_status_type_id = ps.post_status_type_id');
  query.push('LEFT JOIN "user" u ON u.user_id = p.inserted_by');
  query.push('LEFT JOIN provider_user pu ON pu.user_id = u.user_id AND pu.deleted IS NULL');
  query.push('LEFT JOIN provider prov ON prov.provider_id = pu.provider_id AND prov.deleted IS NULL');
  query.push('WHERE p.deleted IS NULL');

  if (filters.title) {
    query.push('AND p.title LIKE $' + ++p );
    params.push('%' + filters.title + '%');
  }

  query.push('ORDER BY p.inserted DESC');

  this._client.query(query.join('\n'), params, function (err, results) {
    if (err) {
      callback(err);
      return;
    }

    callback(null, results.rows);
  });
};

PostData.prototype.getLatest = function (limit, callback) {
  var query = [];
  var params = [];
  query.push('SELECT p.post_id, pst.post_status_type_id, p.title, p.summary, p.content, p.published, p.inserted, p.updated, p.slug,');
  query.push('CASE WHEN ps.post_status_type_id IN(1,3) AND cp.post_id IS NULL THEN 1 ELSE NULL END AS can_edit,');
  query.push('CASE WHEN ps.post_status_type_id IN(1,3) AND cp.post_id IS NULL THEN 1 ELSE NULL END AS can_delete,');
  query.push('COALESCE(EXTRACT(EPOCH FROM p.updated),EXTRACT(EPOCH FROM p.published)) last_modified,');
  query.push('EXTRACT(YEAR FROM p.published) published_year,');
  query.push('prov.provider_id, pu.uid provider_user_uid,');
  query.push('u.name author_name');
  query.push('FROM post p');
  query.push('INNER JOIN post_status ps ON ps.post_id = p.post_id AND ps.deleted IS NULL AND ps.post_status_type_id = 3');
  query.push('LEFT JOIN (');
    query.push('SELECT p.parent_post_id, p.post_id');
    query.push('FROM post p');
    query.push('INNER JOIN post_status ps ON ps.post_id = p.post_id AND ps.deleted IS NULL AND ps.post_status_type_id = 5');
    query.push('WHERE p.parent_post_id IS NOT NULL AND p.deleted IS NULL');
  query.push(') cp ON cp.parent_post_id = p.post_id');
  query.push('LEFT JOIN post_status_type pst ON pst.post_status_type_id = ps.post_status_type_id');
  query.push('LEFT JOIN "user" u ON u.user_id = p.inserted_by');
  query.push('LEFT JOIN provider_user pu ON pu.user_id = u.user_id AND pu.deleted IS NULL');
  query.push('LEFT JOIN provider prov ON prov.provider_id = pu.provider_id AND prov.deleted IS NULL');
  query.push('WHERE p.deleted IS NULL');
  query.push('ORDER BY p.published DESC');
  if (limit) {
    query.push('LIMIT $1');
    params.push(limit);
  }
  this._client.query(query.join('\n'), params, function (err, results) {
    if (err) {
      callback(err);
      return;
    }

    callback(null, results.rows);
  });
};

PostData.prototype.getUnapproved = function (callback) {
  var query = [];
  var params = [];
  query.push('SELECT p.post_id, pst.post_status_type_id, p.title, p.summary, p.content, p.published, p.inserted, p.updated, p.slug,');
  query.push('pst.name AS post_status,');
  query.push('CASE WHEN ps.post_status_type_id IN(1,3) AND cp.post_id IS NULL THEN 1 ELSE NULL END AS can_edit,');
  query.push('CASE WHEN ps.post_status_type_id IN(1,3) AND cp.post_id IS NULL THEN 1 ELSE NULL END AS can_delete,');
  query.push('COALESCE(EXTRACT(EPOCH FROM p.updated),EXTRACT(EPOCH FROM p.published)) last_modified,');
  query.push('EXTRACT(YEAR FROM p.published) published_year,');
  query.push('prov.provider_id, pu.uid provider_user_uid,');
  query.push('u.name author_name');
  query.push('FROM post p');
  query.push('INNER JOIN post_status ps ON ps.post_id = p.post_id AND ps.deleted IS NULL AND ps.post_status_type_id IN(2,5)');
  query.push('LEFT JOIN (');
    query.push('SELECT p.parent_post_id, p.post_id');
    query.push('FROM post p');
    query.push('INNER JOIN post_status ps ON ps.post_id = p.post_id AND ps.deleted IS NULL AND ps.post_status_type_id = 5');
    query.push('WHERE p.parent_post_id IS NOT NULL AND p.deleted IS NULL');
  query.push(') cp ON cp.parent_post_id = p.post_id');
  query.push('LEFT JOIN post_status_type pst ON pst.post_status_type_id = ps.post_status_type_id');
  query.push('LEFT JOIN "user" u ON u.user_id = p.inserted_by');
  query.push('LEFT JOIN provider_user pu ON pu.user_id = u.user_id AND pu.deleted IS NULL');
  query.push('LEFT JOIN provider prov ON prov.provider_id = pu.provider_id AND prov.deleted IS NULL');
  query.push('WHERE p.deleted IS NULL');
  query.push('ORDER BY p.inserted DESC');
  this._client.query(query.join('\n'), params, function (err, results) {
    if (err) {
      callback(err);
      return;
    }

    callback(null, results.rows);
  });
};

PostData.prototype.getBySlug = function (slug, callback) {
  var query = [];
  var params = [];
  query.push('SELECT p.post_id, pst.post_status_type_id, p.title, p.summary, p.content, p.published, p.inserted, p.updated, p.slug,');
  query.push('CASE WHEN ps.post_status_type_id IN(1,3) AND cp.post_id IS NULL THEN 1 ELSE NULL END AS can_edit,');
  query.push('CASE WHEN ps.post_status_type_id IN(1,3) AND cp.post_id IS NULL THEN 1 ELSE NULL END AS can_delete,');
  query.push('prov.provider_id, pu.uid provider_user_uid,');
  query.push('u.name author_name');
  query.push('FROM post p');
  query.push('INNER JOIN post_status ps ON ps.post_id = p.post_id AND ps.deleted IS NULL AND ps.post_status_type_id = 3');
  query.push('LEFT JOIN (');
    query.push('SELECT p.parent_post_id, p.post_id');
    query.push('FROM post p');
    query.push('INNER JOIN post_status ps ON ps.post_id = p.post_id AND ps.deleted IS NULL AND ps.post_status_type_id = 5');
    query.push('WHERE p.parent_post_id IS NOT NULL AND p.deleted IS NULL');
  query.push(') cp ON cp.parent_post_id = p.post_id');
  query.push('LEFT JOIN post_status_type pst ON pst.post_status_type_id = ps.post_status_type_id');
  query.push('LEFT JOIN "user" u ON u.user_id = p.inserted_by');
  query.push('LEFT JOIN provider_user pu ON pu.user_id = u.user_id AND pu.deleted IS NULL');
  query.push('LEFT JOIN provider prov ON prov.provider_id = pu.provider_id AND prov.deleted IS NULL');
  query.push('WHERE p.deleted IS NULL');
  query.push('AND p.slug = $1')
  query.push('ORDER BY p.inserted DESC');
  params.push(slug);
  this._client.query(query.join('\n'), params, function (err, results) {
    if (err) {
      callback(err);
      return;
    }

    callback(null, results.rows[0]);
  });
}

PostData.prototype.getTagByName = function (name, callback) {
  var query = [], params = [], p = 0;

  query.push('SELECT t.tag_id, t.name, t.pretty_name, t.content,');
  query.push('COUNT(p.post_id) AS posts_count');
  query.push('FROM tag t');
  query.push('INNER JOIN post_tag pt ON pt.tag_id = t.tag_id AND pt.deleted IS NULL');
  query.push('INNER JOIN post p ON p.post_id = pt.post_id AND p.deleted IS NULL');
  query.push('INNER JOIN post_status ps ON ps.post_id = p.post_id AND ps.post_status_type_id = 3 AND ps.deleted IS NULL');
  query.push('WHERE LOWER(t.name) = $' + ++p);
  params.push(name.toLowerCase());

  query.push('AND t.deleted IS NULL');
  query.push('GROUP BY t.tag_id');
  
  this._client.query(query.join('\n'), params, function (err, result) {
    if (err) {
      callback(err);
    }
    else if (!result.rows.length) {
      callback();
    }
    else {
      callback(null, result.rows[0]);
    }
  });
};

PostData.prototype.getPostsByTagId = function (data, callback) {
  var query = [], params = [], p = 0;

  query.push('SELECT p.post_id, p.parent_post_id, pst.post_status_type_id, p.title, p.summary, p.content, p.published, p.inserted, p.inserted_by, p.updated, p.updated_by, p.slug,');
  query.push('prov.provider_id, pu.uid provider_user_uid,');
  query.push('u.name author_name');
  query.push('FROM tag t');
  query.push('INNER JOIN post_tag pt ON pt.tag_id = t.tag_id AND pt.deleted IS NULL');
  query.push('INNER JOIN post p ON p.post_id = pt.post_id AND p.deleted IS NULL');
  query.push('INNER JOIN post_status ps ON ps.post_id = p.post_id AND ps.deleted IS NULL AND ps.post_status_type_id = 3');
  query.push('LEFT JOIN post_status_type pst ON pst.post_status_type_id = ps.post_status_type_id');
  query.push('LEFT JOIN "user" u ON u.user_id = p.inserted_by');
  query.push('LEFT JOIN provider_user pu ON pu.user_id = u.user_id AND pu.deleted IS NULL');
  query.push('LEFT JOIN provider prov ON prov.provider_id = pu.provider_id AND prov.deleted IS NULL');
  query.push('WHERE t.deleted IS NULL');
  query.push('AND t.tag_id = $1')
  query.push('ORDER BY p.inserted DESC');
  query.push('LIMIT $2 OFFSET $3')
  params.push(data.tag_id, data.limit, data.start);

  this._client.query(query.join('\n'), params, function (err, result) {
    if (err) {
      callback(err);
    }
    else {
      callback(null, result.rows);
    }
  });
};

PostData.prototype.findById = function (post_id, callback) {
  var query = [];
  var params = [];
  query.push('SELECT p.post_id, p.parent_post_id, pst.post_status_type_id, p.title, p.summary, p.content, p.published, p.inserted, p.inserted_by, p.updated, p.updated_by, p.slug,');
  query.push('CASE WHEN ps.post_status_type_id IN(1,3) AND cp.post_id IS NULL THEN 1 ELSE NULL END AS can_edit,');
  query.push('CASE WHEN ps.post_status_type_id IN(1,3) AND cp.post_id IS NULL THEN 1 ELSE NULL END AS can_delete,');
  query.push('prov.provider_id, pu.uid provider_user_uid,');
  query.push('u.name author_name');
  query.push('FROM post p');
  query.push('INNER JOIN post_status ps ON ps.post_id = p.post_id AND ps.deleted IS NULL');
  query.push('LEFT JOIN (');
    query.push('SELECT p.parent_post_id, p.post_id');
    query.push('FROM post p');
    query.push('INNER JOIN post_status ps ON ps.post_id = p.post_id AND ps.deleted IS NULL AND ps.post_status_type_id = 5');
    query.push('WHERE p.parent_post_id IS NOT NULL AND p.deleted IS NULL');
  query.push(') cp ON cp.parent_post_id = p.post_id');
  query.push('LEFT JOIN post_status_type pst ON pst.post_status_type_id = ps.post_status_type_id');
  query.push('LEFT JOIN "user" u ON u.user_id = p.inserted_by');
  query.push('LEFT JOIN provider_user pu ON pu.user_id = u.user_id AND pu.deleted IS NULL');
  query.push('LEFT JOIN provider prov ON prov.provider_id = pu.provider_id AND prov.deleted IS NULL');
  query.push('WHERE p.deleted IS NULL');
  query.push('AND p.post_id = $1')
  query.push('ORDER BY p.inserted DESC');
  params.push(post_id);
  this._client.query(query.join('\n'), params, function (err, results) {
    if (err) {
      callback(err);
      return;
    }

    callback(null, results.rows[0]);
  });
};

PostData.prototype.update = function (data, callback) {
  var query = [];
  var params = [];
  var p = 0;

  query.push('INSERT INTO post')
  query.push('(parent_post_id, title, slug, summary, content, published, inserted, inserted_by)');
  query.push('SELECT ');

  // Original Post ID
  query.push('$' + ++p + ',');
  params.push(data.post_id);

  // Title
  query.push('$' + ++p + ',');
  params.push(data.title);

  // Slug
  query.push('slug,');

  // Summary
  if (data.summary) {
    query.push('$' + ++p + ',');
    params.push(data.summary);
  }
  else {
    query.push('NULL,');
  }

  // Content
  query.push('$' + ++p + ',');
  params.push(data.content);

  //Published
  if (data.published_date && data.published_time) {
    query.push('$' + ++p + ',');
    params.push(data.published_date + ' ' + data.published_time);
  }
  else {
    query.push('published,');
  }

  //Inserted
  query.push('NOW(),');

  //Inserted by
  query.push('$' + ++p);
  params.push(data.by);

  query.push('FROM post WHERE post_id = $' + ++p);
  params.push(data.post_id);
  query.push('RETURNING post_id');

  this._client.query(query.join('\n'), params, function (err, results) {
    var post_id;
    var query = [];
    var params = [];

    if (err) {
      callback(err);
      return;
    }

    post_id = results.rows[0].post_id;
    query.push('INSERT INTO post_status');
    query.push('(post_id, post_status_type_id, inserted, inserted_by)');
    query.push('VALUES($1, $2, $3, $4)');
    this._client.query(query.join('\n'), [post_id, 5, 'NOW()', data.by], function (err, results) {
      if (err) {
        callback(err);
        return;
      }

      callback(null, post_id);
    });
  }.bind(this));
};

PostData.prototype.save = function (data, callback) {
  if (!data.post_id) {
    this._generateSlug(data.title, function (err, slug) {
      if (err) {
        callback(err);
        return;
      }

      data.slug = slug;

      this._insertPost(data, function (err, result) {
        var statusData = {};

        if (err) {
          callback(err);
        }
        else {
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

          this._updateStatus(statusData, function (err) {
            if (err) {
              callback(err);
            }
            else {
              callback(null, statusData.post_id);
            }
          });
        }
      }.bind(this));
    }.bind(this));
  }
  else {
    this._updatePost(data, function (err, result) {
      var statusData = {};

      if (err) {
        callback(err);
      }
      else if (data.post_status_type_id === 2) {
        statusData.by = data.by;
        statusData.post_id = data.post_id;
        statusData.post_status_type_id = 2;
        this._updateStatus(statusData, function (err) {
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
  }
};

PostData.prototype._insertPost = function (data, callback) {
    var query = [];
    var params = [];
    var p = 0;

    query.push('INSERT INTO post')
    query.push('(title, slug, summary, content, published, inserted, inserted_by)');
    query.push('VALUES(');

    // Title
    query.push('$' + ++p + ',');
    params.push(data.title);

    // Slug
    query.push('$' + ++p + ',');
    params.push(data.slug);

    // Summary
    if (data.summary) {
      query.push('$' + ++p + ',');
      params.push(data.summary);
    }
    else {
      query.push('NULL,');
    }

    // Content
    query.push('$' + ++p + ',');
    params.push(data.content);

    //Published
    if (data.published_date && data.published_time) {
      query.push('$' + ++p + ',');
      params.push(data.published_date + ' ' + data.published_time);
    }
    else {
      query.push('NOW(),');
    }

    //Inserted
    query.push('NOW(),');

    //Inserted by
    query.push('$' + ++p);
    params.push(data.by);

    query.push(')');
    query.push('RETURNING post_id');

    this._client.query(query.join('\n'), params, callback);
};

PostData.prototype._updatePost = function (data, callback) {
    var query = [];
    var params = [];
    var p = 0;

    query.push('UPDATE post SET')

    // Title
    query.push('title = $' + ++p + ',');
    params.push(data.title);

    // Summary
    if (data.summary) {
      query.push('summary = $' + ++p + ',');
      params.push(data.summary);
    }
    else {
      query.push('summary = NULL,');
    }

    // Content
    query.push('content = $' + ++p + ',');
    params.push(data.content);

    //Published
    if (data.published_date && data.published_time) {
      query.push('published = $' + ++p + ',');
      params.push(data.published_date + ' ' + data.published_time);
    }

    //Inserted
    query.push('updated = NOW(),');

    //Inserted by
    query.push('updated_by = $' + ++p);
    params.push(data.by);

    //Which
    query.push('WHERE post_id = $' + ++p);
    params.push(data.post_id);

    this._client.query(query.join('\n'), params, callback);
};

PostData.prototype.reject = function (data, callback) {
  var postStatus = {
    post_id: data.post_id,
    by: data.by,
    post_status_type_id: 4
  }
  this._updateStatus(postStatus, callback);
};

PostData.prototype.approve = function (data, callback) {
  this.findById(data.post_id, function (err, post) {
    if (err) {
      callback(err);
      return;
    }

    var postStatus = {
      post_id: data.post_id,
      by: data.by,
      post_status_type_id: 3
    };
    this._updateStatus(postStatus, function (err) {
      if (err) {
        callback(err);
        return;
      }

      if (!post.parent_post_id) {
        callback();
        return;
      }

      var postStatus = {
        post_id: post.parent_post_id,
        by: data.by,
        post_status_type_id: 6
      };
      this._updateStatus(postStatus, callback);
    }.bind(this));
  }.bind(this));
};

PostData.prototype.delete = function (data, callback) {
  var query = [];
  var p = 0;
  var params = [];

  query.push('UPDATE post SET');

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
  query.push('AND post_id IN (' + data.post_id.map(function () { return '$' + ++p; }).join(',') + ')');
  params.push.apply(params, data.post_id);

  this._client.query(query.join('\n'), params, function (err, result) {
    if (err) {
      callback(err);
      return;
    }

    callback();
  });
};

PostData.prototype._generateSlug = function (text, callback) {
  this._checkSlugUnique(slug(text), 0, callback);
};

PostData.prototype._checkSlugUnique = function (slug, count, callback) {
  var query = 'SELECT post_id FROM post WHERE slug = $1';
  var check = slug;

  if (count > 0) {
    check += '-' + count;
  }

  this._client.query(query, [check], function (err, results) {
    if (err) {
      callback(err);
      return
    }

    if (results.rows.length === 0) {
      callback(null, check);
    }
    else {
      this._checkSlugUnique(slug, ++count, callback);
    }
  }.bind(this));
};

PostData.prototype._updateStatus = function (data, callback) {
  var query = [];
  var params;
  this._client.query('BEGIN', function (err) {
    if (err) {
      this._rollback(function () { callback(err); });
    }
    else {
      query.push('UPDATE post_status SET');
      query.push('deleted = NOW(),');
      query.push('deleted_by = $1,');
      query.push('updated = NOW(),');
      query.push('updated_by = $2');
      query.push('WHERE post_id = $3 AND deleted IS NULL;');
      params = [ data.by, data.by, data.post_id ];
      this._client.query(query.join('\n'), params, function (err, result) {
        var query = [];
        var params;

        if (err) {
          this._rollback(function () { callback(err); });
        }
        else {
          query.push('INSERT INTO post_status');
          query.push('(post_id, post_status_type_id, inserted, inserted_by)');
          query.push('VALUES($1, $2, NOW(), $3);');
          params = [ data.post_id, data.post_status_type_id, data.by ];
          this._client.query(query.join('\n'), params, function (err, result) {
            if (err) {
              this._rollback(function () { callback(err); })
            }
            else {
              this._commit(callback);
            }
          }.bind(this));
        }
      }.bind(this));
    }
  }.bind(this));
};

PostData.prototype._savePostTags = function (data, callback) {
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

PostData.prototype._rollback = function (callback) {
  this._client.query('ROLLBACK', callback);
};

PostData.prototype._commit = function (callback) {
  this._client.query('COMMIT', callback);
};

PostData.prototype.getTags = function (post_id, callback) {
  var query = [], params = [], p = 0;

  query.push('SELECT t.name, t.pretty_name, t.content');
  query.push('FROM post_tag pt');
  query.push('INNER JOIN tag t ON t.tag_id = pt.tag_id AND t.deleted IS NULL');

  query.push('WHERE pt.post_id = $' + ++p);
  params.push(post_id);

  query.push('AND pt.deleted IS NULL');

  this._client.query(query.join('\n'), params, function (err, result) {
    if (err) {
      callback(err);
    }
    else {
      callback(null, result.rows);
    }
  });
};

PostData.prototype.getActivity = function (callback) {
  var query = [];

  query.push('SELECT COUNT(p.post_id) post_count, TO_CHAR(NOW() - (numbers || \' month\')::INTERVAL, \'YYYY-MM\') year_month');
  query.push('FROM GENERATE_SERIES(0,11) numbers');
  query.push('LEFT JOIN (');
    query.push('SELECT p.post_id, p.inserted');
    query.push('FROM post p');
    query.push('INNER JOIN post_status ps ON ps.post_id = p.post_id AND ps.deleted IS NULL AND ps.post_status_type_id = 3');
    query.push('WHERE p.deleted IS NULL');
  query.push(') p ON TO_CHAR(p.inserted, \'YYYY-MM\') = TO_CHAR(NOW() - (numbers || \' month\')::INTERVAL, \'YYYY-MM\')');
  query.push('GROUP BY year_month');
  query.push('ORDER by year_month ASC') ;

  this._client.query(query.join('\n'), callback);
};

function newPostData(client) {
  var postData = new PostData();
  postData.setClient(client);
  return postData;
}

module.exports = newPostData;
