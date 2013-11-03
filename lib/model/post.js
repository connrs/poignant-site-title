var moment = require('moment');
var findHashtags = require('find-hashtags');
var Model = require('./model');
var Tag = require('./tag');

function Post(store) {
  if (!(this instanceof Post)) {
    return new Post(store);
  }

  Model.apply(this, arguments);
  this._store = store;
  this._validationRules = [
    { field: 'summary', rule: 'BothTitleAndSummary', message: 'You must provide a title in order for there to be a summary' },
    { field: 'content', rule: 'NotEmpty', message: 'You must add some content' },
    { field: 'published_date', rule: 'IsDateString', message: 'The published date is invalid' },
    { field: 'published_time', rule: 'IsTimeString', message: 'The published time is invalid' },
    { field: 'published_date', rule: 'BothDateAndTime', message: 'You must provide both the date and time if you wish to set the published date' }
  ];
}

Post.prototype = Object.create(Model.prototype, { constructor: Post });

Post.prototype.setTagData = function (tagData) {
  this._tagData = tagData;
}

Post.prototype.save = function (callback) {
  this._store.save(this._data, callback);
};

Post.prototype.update = function (callback) {
  this._store.update(this._data, callback);
};

Post.prototype.findById = function (post_id, callback) {
  this._store.find({ post_id: post_id }, callback);
};

Post.prototype.find = function (filters, callback) {
  this._store.find(filters, callback);
};

Post.prototype.getLatest = function (limit, callback) {
  var data = {
    post_status_type_id: 3,
    limit: limit
  };

  this._store.find(data, function (err, posts) {
    if (err) {
      callback(err);
    }
    else {
      var toTag = posts.length;
      var error;
      var p

      for (p = 0; p < posts.length; p++) {
        (function (p) {
          this._store.getTags(posts[p].post_id, function (err, tags) {
            if (error) {
              return;
            }
            else if (err) {
              error = err;
              callback(err);
            }
            else {
              posts[p].tags = tags;

              if (--toTag === 0) {
                callback(null, posts);
              }
            }
          });
        }.bind(this))(p);
      }
    }
  }.bind(this));
};

Post.prototype.getUnapproved = function (callback) {
  this._store.getUnapproved(callback);
};

Post.prototype.getBySlug = function (slug, callback) {
  this._store.find({ slug: slug, post_status_type_id: 3 }, function (err, post) {
    if (err) {
      callback(err);
    }
    else {
      this._store.getTags(post.post_id, function (err, tags) {
        if (err) {
          callback(err);
        }
        else {
          post.tags = tags;
          callback(null, post);
        }
      });
    }
  }.bind(this));
};

Post.prototype.hasChanged = function (callback) {
  this._store.find({ post_id: this._data.post_id }, function (err, post) {
    var changed = false;

    if (err) {
      callback(err);
    }
    else {
      if (post.title !== this._data.title) {
        changed = true;
      }

      if (post.summary !== this._data.summary) {
        changed = true;
      }

      if (post.content !== this._data.content) {
        changed = true;
      }

      if (this._data.published_date && moment(post.published).format('YYYY-MM-DD') !== post.published_date) {
        changed = true;
      }

      if (this._data.published_time && moment(post.published).format('HH:mm') !== post.published_date) {
        changed = true;
      }

      callback(null, changed);
    }
  }.bind(this));
};

Post.prototype.approve = function (callback) {
  this._store.approve(this._data, function (err) {
    if (err) {
      callback(err);
    }
    else {
      this.find({post_id: this._data.post_id}, function (err, postData) {
        if (err) {
          callback(err);
        }
        else {
          this.setData({
            post_id: postData.post_id,
            content: postData.content,
            by: postData.inserted_by
          });
          this._updatePostTags(callback);
        }
      }.bind(this));
    }
  }.bind(this));
};

Post.prototype.reject = function (callback) {
  this._store.reject(this._data, callback);
};

Post.prototype.delete = function (callback) {
  this._store.delete(this._data, callback);
};

Post.prototype.getTagByName = function (name, callback) {
  this._store.getTagByName(name, callback);
};

Post.prototype.getActivity = function (callback) {
  this._store.getActivity(callback);
}

Post.prototype._validateIsTimeString = function (value, callback) {
  var timeStringExp = /^\s*([01]?\d|2[0-3]):?([0-5]\d)\s*$/;

  callback(null, !value || value.match(timeStringExp) !== null);
};

Post.prototype._validateIsDateString = function (value, callback) {
  var dateStringExp = /^\d{4}-[01]\d-[0-3]\d$/;

  callback(null, !value || (value.match(dateStringExp) !== null && moment(value, 'YYYY-MM-DD').isValid()));
};

Post.prototype._validateBothDateAndTime = function (value, callback) {
  callback(null, (!this._data.published_date && !this._data.published_time) || (this._data.published_date && this._data.published_time));
};

Post.prototype._validateBothTitleAndSummary = function (value, callback) {
  callback(null, !this._data.summary || this._data.title);
};

Post.prototype._newTag = function () {
  var tag = new Tag();
  tag.setTagData(this._tagData);
  return tag;
};

Post.prototype._updatePostTags = function (callback) {
  var tag;
  var hashtags = findHashtags(this._data.content);

  if (hashtags === null) {
    callback(null, this._data.post_id);
  }
  else {
    tag = this._newTag();
    tag.setData({ names: hashtags, by: this._data.by });
    tag.saveMultiple(function (err, tag_ids) {
      if (err || !tag_ids) {
        callback(null, this._data.post_id);
      }
      else {
        this._store._savePostTags({post_id: this._data.post_id, tag_ids: tag_ids, by: this._data.by}, callback);
      }
    }.bind(this));
  }
};

module.exports = Post;
