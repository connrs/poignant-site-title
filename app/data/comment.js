function CommentData() {}

CommentData.prototype.setClient = function (client) {
  this._client = client;
};

CommentData.prototype.save = function (data, callback) {
  if (!data.comment_id) {
    this._insertComment(data, function (err, result) {
      var statusData;

      if (err) {
        callback(err);
      }
      else if (!result.rows) {
        callback();
      }
      else {
        statusData = {
          comment_id: result.rows[0].comment_id,
          comment_status_type_id: 1,
          by: data.by
        };
        this._insertStatus(statusData, function (err) {
          if (err) {
            callback(err);
          }
          else if (data.post_id) {
            var commentPostData = {
              comment_id: result.rows[0].comment_id,
              post_id: data.post_id,
              by: data.by
            }
            this._insertCommentPost(commentPostData, callback);
          }
          else {
            callback();
          }
        }.bind(this));
      }
    }.bind(this));
  }
  else {
    this._updateComment(data, callback);
  }
};

CommentData.prototype.find = function (data, callback) {
  if (data.page !== undefined && data.limit !== undefined) {
    this._count(data, function (err, count) {
      if (err) {
        callback(err);
        return;
      }

      this._find(data, function (err, comments) {
        if (err) {
          callback(err);
          return;
        }

        callback(null, {
          count: count,
          comments: comments
        });
      }.bind(this));
    }.bind(this));
  }
  else {
    this._find(data, callback);
  }
};

CommentData.prototype.findPublished = function (data, callback) {
  data.comment_status_type_id = 2;
  this.find(data, callback);
};

CommentData.prototype.approve = function (data, callback) {
  this.find({comment_id: data.comment_id}, function (err, comment) {
    if (err) {
      callback(err);
    }
    else {
      var commentStatus = {
        comment_id: data.comment_id,
        by: data.by,
        comment_status_type_id: 2
      };
      this._updateStatus(commentStatus, function (err) {
        if (err) {
          callback(err);
        }
        else {
          callback();
        }
      }.bind(this));
    }
  }.bind(this));
};

CommentData.prototype.decline = function (data, callback) {
  this.find({comment_id: data.comment_id}, function (err, comment) {
    if (err) {
      callback(err);
    }
    else {
      var commentStatus = {
        comment_id: data.comment_id,
        by: data.by,
        comment_status_type_id: 3
      };
      this._updateStatus(commentStatus, function (err) {
        if (err) {
          callback(err);
        }
        else {
          callback();
        }
      }.bind(this));
    }
  }.bind(this));
};

CommentData.prototype.delete = function (data, callback) {
  var query = [];
  var p = 0;
  var params = [];

  query.push('UPDATE comment SET');

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
  query.push('AND comment_id IN (' + data.comment_id.map(function () { return '$' + ++p; }).join(',') + ')');
  params.push.apply(params, data.comment_id);

  this._client.query(query.join('\n'), params, function (err, result) {
    if (err) {
      callback(err);
      return;
    }

    callback();
  });
};

CommentData.prototype._count = function (data, callback) {
  var query = [];
  var params = [];
  var p = 0;

  query.push('SELECT COUNT(c.comment_id) AS count');
  query.push('FROM comment c');
  query.push('INNER JOIN comment_status cs ON cs.comment_id = c.comment_id AND cs.deleted IS NULL');

  if (data.comment_status_type_id) {
    query.push('AND cs.comment_status_type_id = $' + ++p);
    params.push(data.comment_status_type_id);
  }

  query.push('INNER JOIN comment_status_type cst ON cst.comment_status_type_id = cs.comment_status_type_id');

  if (data.post_id) {
    query.push('INNER JOIN comment_post cp ON cp.comment_id = c.comment_id AND cp.deleted IS NULL AND cp.post_id = $' + ++p);
    params.push(data.post_id);
  }

  query.push('LEFT JOIN "user" u ON u.user_id = c.inserted_by AND u.deleted IS NULL');

  query.push('WHERE c.deleted IS NULL');

  if (data.comment_id) {
    query.push('AND c.comment_id = $' + ++p);
    params.push(data.comment_id);
  }

  this._client.query(query.join('\n'), params, function (err, result) {
    if (err) {
      callback(err);
    }
    else {
      callback(null, result.rows[0].count);
    }
  });
};

CommentData.prototype._find = function (data, callback) {
  var query = [];
  var params = [];
  var p = 0;

  query.push('SELECT c.comment_id, c.content, c.inserted,');
  query.push('CASE WHEN cs.comment_status_type_id = 2 THEN 1 ELSE NULL END can_delete,');
  query.push('u.user_id, u.name user_name,');
  query.push('cst.name comment_status,');
  query.push('cs.comment_status_type_id');
  query.push('FROM comment c');
  query.push('INNER JOIN comment_status cs ON cs.comment_id = c.comment_id AND cs.deleted IS NULL');

  if (data.comment_status_type_id) {
    query.push('AND cs.comment_status_type_id = $' + ++p);
    params.push(data.comment_status_type_id);
  }

  query.push('INNER JOIN comment_status_type cst ON cst.comment_status_type_id = cs.comment_status_type_id');

  if (data.post_id) {
    query.push('INNER JOIN comment_post cp ON cp.comment_id = c.comment_id AND cp.deleted IS NULL AND cp.post_id = $' + ++p);
    params.push(data.post_id);
  }

  query.push('LEFT JOIN "user" u ON u.user_id = c.inserted_by AND u.deleted IS NULL');

  query.push('WHERE c.deleted IS NULL');

  if (data.comment_id) {
    query.push('AND c.comment_id = $' + ++p);
    params.push(data.comment_id);
  }

  query.push('ORDER BY c.inserted ASC');

  if (data.page !== undefined && data.limit !== undefined) {
    query.push('LIMIT $' + ++p + ' OFFSET $' + ++p);
    params.push(+data.limit, (data.page - 1) * data.limit);
  }
  else if (data.limit !== undefined) {
    query.push('LIMIT $' + ++p);
    params.push(data.limit);
  }

  this._client.query(query.join('\n'), params, function (err, result) {
    if (err) {
      callback(err);
    }
    else if (data.comment_id) {
      callback(null, result.rows[0]);
    }
    else {
      callback(null, result.rows);
    }
  });
};

CommentData.prototype._insertComment = function (data, callback) {
  var query = [];
  var params = [];
  var p = 0;

  query.push('INSERT INTO comment')
  query.push('(comment_type_id, content, inserted, inserted_by)');
  query.push('VALUES(');

  // Type
  query.push('$' + ++p + ',');
  params.push(data.comment_type_id);

  // Content
  query.push('$' + ++p + ',');
  params.push(data.content + '');

  //Inserted
  query.push('NOW(),');

  //Inserted by
  query.push('$' + ++p);
  params.push(data.by);

  query.push(')');
  query.push('RETURNING comment_id');

  this._client.query(query.join('\n'), params, callback);
};

CommentData.prototype._updateComment = function (data, callback) {
  var query = [];
  var params = [];
  var p = 0;

  query.push('UPDATE comment SET');

  query.push('content = $' + ++p + ',');
  params.push(data.content);

  query.push('updated = NOW(),');

  query.push('updated_by = $' + ++p);
  params.push(data.by);

  query.push('WHERE comment_id = $' + ++p);
  params.push(data.comment_id);

  this._client.query(query.join('\n'), params, callback);
};

CommentData.prototype._insertStatus = function (data, callback) {
  var query = [];
  var params = [];
  var p = 0;

  query.push('INSERT INTO comment_status\n');
  query.push('(comment_id, comment_status_type_id, inserted, inserted_by)');
  query.push('VALUES('); 

  // Comment ID
  query.push('$' + ++p + ',');
  params.push(data.comment_id);

  // Comment Status Type ID
  query.push('$' + ++p + ',');
  params.push(data.comment_status_type_id);

  query.push('NOW(),');

  // By
  query.push('$' + ++p);
  params.push(data.by);

  query.push(')');

  this._client.query(query.join('\n'), params, callback);
};

CommentData.prototype._updateStatus = function (data, callback) {
  var query = [];
  var params;
  this._client.query('BEGIN', function (err) {
    if (err) {
      this._rollback(function () { callback(err); });
    }
    else {
      query.push('UPDATE comment_status SET');
      query.push('deleted = NOW(),');
      query.push('deleted_by = $1,');
      query.push('updated = NOW(),');
      query.push('updated_by = $2');
      query.push('WHERE comment_id = $3 AND deleted IS NULL;');
      params = [ data.by, data.by, data.comment_id ];
      this._client.query(query.join('\n'), params, function (err, result) {
        var query = [];
        var params;

        if (err) {
          this._rollback(function () { callback(err); });
        }
        else {
          query.push('INSERT INTO comment_status');
          query.push('(comment_id, comment_status_type_id, inserted, inserted_by)');
          query.push('VALUES($1, $2, NOW(), $3);');
          params = [ data.comment_id, data.comment_status_type_id, data.by ];
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

CommentData.prototype._insertCommentPost = function (data, callback) {
  var query = [];
  var params = [];
  var p = 0;

  query.push('INSERT INTO comment_post');
  query.push('(comment_id, post_id, inserted, inserted_by)');
  query.push('VALUES(');

  query.push('$' + ++p + ',');
  params.push(data.comment_id);

  query.push('$' + ++p + ',');
  params.push(data.post_id);

  query.push('NOW(),');

  query.push('$' + ++p);
  params.push(data.by);

  query.push(')')

  this._client.query(query.join('\n'), params, callback);
};

CommentData.prototype._rollback = function (callback) {
  this._client.query('ROLLBACK', callback);
};

CommentData.prototype._commit = function (callback) {
  this._client.query('COMMIT', callback);
};

function newCommentData(client) {
  var commentData = new CommentData();
  commentData.setClient(client);
  return commentData;
}

module.exports = newCommentData;
