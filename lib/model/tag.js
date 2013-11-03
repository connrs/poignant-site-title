var moment = require('moment');
var Model = require('./model');
var findHashtags = require('find-hashtags');

function Tag(store) {
  if (!(this instanceof Tag)) {
    return new Tag(store);
  }

  Model.apply(this, arguments);
  this._validationRules = [
    { field: 'name', rule: 'NotEmpty', message: 'You must name the tag' },
    { field: 'name', rule: 'IsHashtag', message: 'A hashtag must contain no spaces or punctuation' }
  ];
  this._store = store;
}

Tag.prototype = Object.create(Model.prototype, { constructor: Tag });

Tag.prototype.save = function (callback) {
  this._store.save(this._data, callback);
};

Tag.prototype.find = function (filters, callback) {
  this._store.find(filters, callback);
};

Tag.prototype.findById = function (tag_id, callback) {
  this._store.find({ tag_id: tag_id }, callback);
};

Tag.prototype.findByName = function (name, callback) {
  this._store.find({ name: name }, callback);
};

Tag.prototype.all = function (callback) {
  this._store.find({}, callback);
};

Tag.prototype.allWithPosts = function (callback) {
  this._store.find({post_count: true}, callback);
};

Tag.prototype.delete = function (callback) {
  this._store.delete(this._data, callback);
};

Tag.prototype.saveMultiple = function (callback) {
  var count = this._data.names.length;
  var ids = [];
  var error;

  if (count === 0) {
    callback(null, []);
  }
  else {
    this._data.names.forEach(function (name) {
      if (error) {
        return;
      }

      this.find({ name: name }, function (err, tagData) {
        if (error) {
          return;
        }
        else if (err) {
          error = err;
          callback(err);
        }
        else if (!tagData) {
          this._store.save({ name: name, by: this._data.by }, function (err, tagData) {
            if (error) {
              return;
            }
            else if (err) {
              error = err;
              callback(err);
            }
            else {
              ids.push(tagData.tag_id);
              if (--count === 0) {
                callback(null, ids);
              }
            }
          }.bind(this));
        }
        else {
          ids.push(tagData.tag_id);
          if (--count === 0) {
            callback(null, ids);
          }
        }
      }.bind(this));
    }.bind(this));
  }
};

Tag.prototype.hasChanged = function (callback) {
  this.findById(this._data.tag_id, function (err, tag) {
    var changed = false;

    if (err) {
      callback(err);
    }
    else {
      if (tag.name !== this._data.name) {
        changed = true;
      }

      if (tag.pretty_name !== this._data.pretty_name) {
        changed = true;
      }

      if (tag.content !== this._data.content) {
        changed = true;
      }

      callback(null, changed);
    }
  }.bind(this));
};

Tag.prototype._validateIsHashtag = function (name, callback) {
  var hashtag = '#' + name;
  var hashtags = findHashtags(hashtag);

  callback(null, hashtags !== null && hashtags[0] === name.toLowerCase());
};

module.exports = Tag;
