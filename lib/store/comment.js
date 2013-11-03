function CommentStore(pg) {
  if (!(this instanceof CommentStore)) {
    return new CommentStore(pg);
  }

  this._pg = pg;
}

CommentStore.prototype.save = function (data, callback) {
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

CommentStore.prototype.find = function (data, callback) {
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

CommentStore.prototype.findPublished = function (data, callback) {
  data.comment_status_type_id = 2;
  this.find(data, callback);
};

CommentStore.prototype.approve = function (data, callback) {
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

CommentStore.prototype.decline = function (data, callback) {
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

CommentStore.prototype.delete = function (data, callback) {
  this._pg.client(function (err, query) {
    if (err) {
      callback(err);
    }
    else {
      var sql = [];
      var p = 0;
      var params = [];

      sql.push('UPDATE comment SET');

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
      sql.push('AND comment_id IN (' + data.comment_id.map(function () { return '$' + ++p; }).join(',') + ')');
      params.push.apply(params, data.comment_id);

      query(sql.join('\n'), params, function (err, result) {
        if (err) {
          callback(err);
          return;
        }

        callback();
      });
    }
  })
};

CommentStore.prototype._count = function (data, callback) {
  this._pg.client(function (err, query) {
    if (err) {
      callback(err);
    }
    else {
      var sql = [];
      var params = [];
      var p = 0;

      sql.push('SELECT COUNT(c.comment_id) AS count');
      sql.push('FROM comment c');
      sql.push('INNER JOIN comment_status cs ON cs.comment_id = c.comment_id AND cs.deleted IS NULL');

      if (data.comment_status_type_id) {
        sql.push('AND cs.comment_status_type_id = $' + ++p);
        params.push(data.comment_status_type_id);
      }

      sql.push('INNER JOIN comment_status_type cst ON cst.comment_status_type_id = cs.comment_status_type_id');

      if (data.post_id) {
        sql.push('INNER JOIN comment_post cp ON cp.comment_id = c.comment_id AND cp.deleted IS NULL AND cp.post_id = $' + ++p);
        params.push(data.post_id);
      }

      sql.push('LEFT JOIN "user" u ON u.user_id = c.inserted_by AND u.deleted IS NULL');

      sql.push('WHERE c.deleted IS NULL');

      if (data.comment_id) {
        sql.push('AND c.comment_id = $' + ++p);
        params.push(data.comment_id);
      }

      query(sql.join('\n'), params, function (err, result) {
        if (err) {
          callback(err);
        }
        else {
          callback(null, result.rows[0].count);
        }
      });
    }
  })
};

CommentStore.prototype._find = function (data, callback) {
  this._pg.client(function (err, query) {
    if (err) {
      callback(err);
    }
    else {
      var sql = [];
      var params = [];
      var p = 0;

      sql.push('SELECT c.comment_id, c.content, c.inserted,');
      sql.push('CASE WHEN cs.comment_status_type_id = 2 THEN 1 ELSE NULL END can_delete,');
      sql.push('u.user_id, u.name user_name,');
      sql.push('cst.name comment_status,');
      sql.push('cs.comment_status_type_id');
      sql.push('FROM comment c');
      sql.push('INNER JOIN comment_status cs ON cs.comment_id = c.comment_id AND cs.deleted IS NULL');

      if (data.comment_status_type_id) {
        sql.push('AND cs.comment_status_type_id = $' + ++p);
        params.push(data.comment_status_type_id);
      }

      sql.push('INNER JOIN comment_status_type cst ON cst.comment_status_type_id = cs.comment_status_type_id');

      if (data.post_id) {
        sql.push('INNER JOIN comment_post cp ON cp.comment_id = c.comment_id AND cp.deleted IS NULL AND cp.post_id = $' + ++p);
        params.push(data.post_id);
      }

      sql.push('LEFT JOIN "user" u ON u.user_id = c.inserted_by AND u.deleted IS NULL');

      sql.push('WHERE c.deleted IS NULL');

      if (data.comment_id) {
        sql.push('AND c.comment_id = $' + ++p);
        params.push(data.comment_id);
      }

      sql.push('ORDER BY c.inserted ASC');

      if (data.page !== undefined && data.limit !== undefined) {
        sql.push('LIMIT $' + ++p + ' OFFSET $' + ++p);
        params.push(+data.limit, (data.page - 1) * data.limit);
      }
      else if (data.limit !== undefined) {
        sql.push('LIMIT $' + ++p);
        params.push(data.limit);
      }

      query(sql.join('\n'), params, function (err, result) {
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
    }
  })
};

CommentStore.prototype._insertComment = function (data, callback) {
  this._pg.client(function (err, query) {
    if (err) {
      callback(err);
    }
    else {
      var sql = [];
      var params = [];
      var p = 0;

      sql.push('INSERT INTO comment')
      sql.push('(comment_type_id, content, inserted, inserted_by)');
      sql.push('VALUES(');

      // Type
      sql.push('$' + ++p + ',');
      params.push(data.comment_type_id);

      // Content
      sql.push('$' + ++p + ',');
      params.push(data.content + '');

      //Inserted
      sql.push('NOW(),');

      //Inserted by
      sql.push('$' + ++p);
      params.push(data.by);

      sql.push(')');
      sql.push('RETURNING comment_id');

      query(sql.join('\n'), params, callback);
    }
  })
};

CommentStore.prototype._updateComment = function (data, callback) {
  this._pg.client(function (err, query) {
    if (err) {
      callback(err);
    }
    else {
      var sql = [];
      var params = [];
      var p = 0;

      sql.push('UPDATE comment SET');

      sql.push('content = $' + ++p + ',');
      params.push(data.content);

      sql.push('updated = NOW(),');

      sql.push('updated_by = $' + ++p);
      params.push(data.by);

      sql.push('WHERE comment_id = $' + ++p);
      params.push(data.comment_id);

      query(sql.join('\n'), params, callback);
    }
  });
};

CommentStore.prototype._insertStatus = function (data, callback) {
  this._pg.client(function (err, query) {
    if (err) {
      callback(err);
    }
    else {
      var sql = [];
      var params = [];
      var p = 0;

      sql.push('INSERT INTO comment_status\n');
      sql.push('(comment_id, comment_status_type_id, inserted, inserted_by)');
      sql.push('VALUES('); 

      // Comment ID
      sql.push('$' + ++p + ',');
      params.push(data.comment_id);

      // Comment Status Type ID
      sql.push('$' + ++p + ',');
      params.push(data.comment_status_type_id);

      sql.push('NOW(),');

      // By
      sql.push('$' + ++p);
      params.push(data.by);

      sql.push(')');

      query(sql.join('\n'), params, callback);
    }
  });
};

CommentStore.prototype._updateStatus = function (data, callback) {
  this._pg.transaction(function (err, client) {
    if (err) {
      callback(err);
    }
    else {
      var query = [];
      var params;
      query.push('UPDATE comment_status SET');
      query.push('deleted = NOW(),');
      query.push('deleted_by = $1,');
      query.push('updated = NOW(),');
      query.push('updated_by = $2');
      query.push('WHERE comment_id = $3 AND deleted IS NULL;');
      params = [ data.by, data.by, data.comment_id ];
      client.query(query.join('\n'), params, function (err, result, client) {
        var query = [];
        var params;

        if (err) {
          client.rollback(callback);
        }
        else {
          query.push('INSERT INTO comment_status');
          query.push('(comment_id, comment_status_type_id, inserted, inserted_by)');
          query.push('VALUES($1, $2, NOW(), $3);');
          params = [ data.comment_id, data.comment_status_type_id, data.by ];
          client.query(query.join('\n'), params, function (err, result, client) {
            if (err) {
              client.rollback(callback);
            }
            else {
              client.commit(callback);
            }
          }.bind(this));
        }
      }.bind(this));
    }
  });
};

CommentStore.prototype._insertCommentPost = function (data, callback) {
  this._pg.client(function (err, query) {
    if (err) {
      callback(err);
    }
    else {
      var sql = [];
      var params = [];
      var p = 0;

      sql.push('INSERT INTO comment_post');
      sql.push('(comment_id, post_id, inserted, inserted_by)');
      sql.push('VALUES(');

      sql.push('$' + ++p + ',');
      params.push(data.comment_id);

      sql.push('$' + ++p + ',');
      params.push(data.post_id);

      sql.push('NOW(),');

      sql.push('$' + ++p);
      params.push(data.by);

      sql.push(')')

      query(sql.join('\n'), params, callback);
    }
  })
};

module.exports = CommentStore;
