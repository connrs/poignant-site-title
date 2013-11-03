var moment = require('moment');
var Model = require('./model');

function Comment(store) {
  if (!(this instanceof Comment)) {
    return new Comment(store);
  }

  Model.apply(this, arguments);
  this._validationRules = [
    { field: 'content', rule: 'NotEmpty', message: 'You must provide some content.' }
  ];
  this._store = store;
}

Comment.prototype = Object.create(Model.prototype, { constructor: Comment });

Comment.prototype.save = function (callback) {
  this._store.save(this._data, callback);
};

Comment.prototype.find = function (filters, callback) {
  this._store.find(filters, callback);
};

Comment.prototype.findById = function (comment_id, callback) {
  this._store.find({ comment_id: comment_id }, callback);
}

Comment.prototype.findPublished = function (callback) {
  this._store.findPublished(this._data, callback);
};

Comment.prototype.approve = function (callback) {
  this._store.approve(this._data, callback);
};

Comment.prototype.decline = function (callback) {
  this._store.decline(this._data, callback);
};

Comment.prototype.delete = function (callback) {
  this._store.delete(this._data, callback);
};

Comment.prototype.hasChanged = function (callback) {
  this._store.find({comment_id: this._data.comment_id}, function (err, comment) {
    var changed = false;

    if (err) {
      callback(err);
    }
    else {
      if (comment.content !== this._data.content) {
        changed = true;
      }

      callback(null, changed);
    }
  }.bind(this));
};

module.exports = Comment;
