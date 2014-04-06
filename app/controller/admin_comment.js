var Controller = require('./core');
var Comment = require('../../lib/model/comment.js');
var error = require('../../lib/error/index.js');

function filtersNotEmpty(filters) {
  var f;

  for (f in filters) {
    if (filters.hasOwnProperty(f) && filters[f] !== '' && filters[f] !== null && filters[f] !== undefined && f !== 'page' && f !== 'limit' && f !== 'csrf_token') {
      return true;
    }
  }

  return false;
}

function AdminCommentController() {
  Controller.apply(this, arguments);
  this._routes = [
    ['all', '/admin/comments', this.index.bind(this)],
    ['head', '/admin/comments', this.index.bind(this)],
    ['get', '/admin/comments/approve/:comment_id', this.approve.bind(this)],
    ['head', '/admin/comments/approve/:comment_id', this.approve.bind(this)],
    ['post', '/admin/comments/approve/:comment_id', this.approvePost.bind(this)],
    ['post', '/admin/comments/delete', this.delete.bind(this)],
    ['post', '/admin/comments/confirm_delete', this.confirmDelete.bind(this)]
  ];
}

AdminCommentController.prototype = Object.create(Controller.prototype, { constructor: AdminCommentController });

AdminCommentController.prototype.setTypes = function (types) {
  this._types = types;
};

AdminCommentController.prototype.setCommentStore = function (commentStore) {
  this._commentStore = commentStore;
};

AdminCommentController.prototype.index = function (obj, done) {
  var limit = 10;
  var page = obj.data.page ? obj.data.page : 1;
  var filters;
  var comment = this._comment();
  var template = this._template(obj, 'admin');
  var context = {
    'current_navigation': 'admin_comments_index'
  };

  if (!obj.hasPermission(['su', 'editor'])) {
    res.render403();
    return;
  }

  context.filters = {
    limit: limit,
    page: page
  };
  context.types = {
    commentStatus: this._types.commentStatus.filter(function (t) { return [1,2].indexOf(t.id) !== -1; })
  };
  context.page = { title: 'Comments dashboard' };

  if (obj.data.clear !== undefined) {
    obj.session.set('admin_comments_index', {}, function (err) {
      context.filters = {
        limit: limit,
        page: page
      };

      if (filtersNotEmpty(context.filters)) {
        comment.find(context.filters, function (err, results) {
          context.comments = results.comments;
          context.pagination = {
            perPage: limit,
            page: page,
            pages: Math.ceil(results.count / limit)
          };
          obj.output = template(context.current_navigation, context);
          done(null, obj);
        }.bind(this));
      }
      else {
        obj.output = template(context.current_navigation, context);
        done(null, obj);
      }
    }.bind(this));
  }
  else if (Object.keys(obj.data).length) {
    obj.session.set('admin_comments_index', obj.data, function (err) {
      context.filters = obj.data;
      context.filters.page = page;
      context.filters.limit = limit;
      if (filtersNotEmpty(context.filters)) {
        comment.find(context.filters, function (err, results) {
          context.comments = results.comments;
          context.pagination = {
            perPage: limit,
            page: page,
            pages: Math.ceil(results.count / limit)
          };
          obj.output = template(context.current_navigation, context);
          done(null, obj);
        }.bind(this));
      }
      else {
        obj.output = template(context.current_navigation, context);
        done(null, obj);
      }
    }.bind(this));
  }
  else {
    context.filters = obj.session.get('admin_comments_index') || {};
    context.filters.page = page;
    context.filters.limit = limit;
    if (filtersNotEmpty(context.filters)) {
      comment.find(context.filters, function (err, results) {
        if (err) { return done(err); }

        context.comments = results.comments;
        context.pagination = {
          perPage: limit,
          page: page,
          pages: Math.ceil(results.count / limit)
        };
        obj.output = template(context.current_navigation, context);
        done(null, obj);
      }.bind(this));
    }
    else {
      obj.output = template(context.current_navigation, context);
      done(null, obj);
    }
  }
};

AdminCommentController.prototype.approve = function (obj, done) {
  if (!obj.hasPermission(['su', 'editor'])) { return done(error.NotAuthorizedError()); }

  var template = this._template(obj, 'admin');
  var context = {
    'current_navigation': 'admin_comments_approve'
  }

  this._comment().findById(obj.params.comment_id, function (err, comment) {
    if (err) {
      done(err);
    }
    else if (!comment) {
      done(new error.NotFoundError());
    }
    else if (comment.comment_status_type_id !== 1) {
      done(new error.BadRequestError(JSON.stringify(comment)));
    }
    else {
      context.comment = comment;
      context.page = { title: 'Approve comment' };
      obj.output = template(context.current_navigation, context);
      done(null, obj);
    }
  }.bind(this));
};

AdminCommentController.prototype.approvePost = function (obj, done) {
  if (!obj.hasPermission(['su', 'editor'])) { return done(new error.NotAuthorizedError()); }

  if (!Object.keys(obj.data).length || obj.data.comment_status_type_id === undefined) { return done(new error.BadRequestError()); }

  if (obj.data.csrf_token !== obj.session.uid()) { return done(new error.BadRequestError()); }

  var comment = this._comment();
  comment.setData({comment_id: obj.params.comment_id, by: obj.current_user.user_id, content: obj.data.content});
  obj.data.comment_status_type_id = +obj.data.comment_status_type_id;

  comment.findById(obj.params.comment_id, function (err, commentData) {
    if (err) { return done(err); }

    if (!commentData || commentData.comment_status_type_id !== 1) { return done(new error.BadRequestError()); }

    if (obj.data.comment_status_type_id === 2) {
      comment.hasChanged(function (err, changed) {
        if (err) {
          done(err);
        }
        else if (!changed) {
          comment.approve(function (err) {
            if (err) {
              return done(err);
            }

            obj.session.set('flash_message', 'Your comment has been approved', function (err) {
              obj.redirect(obj.config.admin_base_address + '/comments', 302);
            });
          }.bind(this));
        }
        else {
          comment.save(function (err) {
            if (err) {
              done(err);
            }
            else {
              comment.approve(function (err) {
                if (err) {
                  return done(err);
                }

                obj.session.set('flash_message', 'Your comment has been approved', function (err) {
                  obj.redirect(obj.config.admin_base_address + '/comments', 302);
                });
              }.bind(this));
            }
          }.bind(this));
        }
      }.bind(this));
    }
    else if (obj.data.comment_status_type_id === 3) {
      comment.decline(function (err) {
        if (err) { return done(err); }

        obj.session.set('flash_message', 'Your comment has been declined', function (err) {
          obj.redirect(obj.config.admin_base_address + '/comments', 302);
        });
      });
    }
    else {
      done(new error.BadRequestError());
    }
  }.bind(this));
};

AdminCommentController.prototype.delete = function (obj, done) {
  if (!obj.hasPermission(['su', 'editor'])) { return done(new error.NotAuthorizedError()); }

  if (Object.keys(obj.data).length === 0) { return done(new error.BadRequestError()); }

  if (obj.data.csrf_token !== obj.session.uid()) { return done(new error.BadRequestError()); }

  var template = this._template(obj, 'admin');
  var context = {
    current_navigation: 'admin_comments_delete'
  }

  context.comment_ids = obj.data.comment_id;
  obj.output = template(context.current_navigation, context);
  done(null, obj);
};

AdminCommentController.prototype.confirmDelete = function (obj, done) {
  if (!obj.hasPermission(['su', 'editor'])) { return done(new error.NotAuthorizedError()); }

  if (!Array.isArray(obj.data.comment_id) || obj.data.comment_id.length === 0) { return done(new error.BadRequestError()); }

  if (obj.data.csrf_token !== obj.session.uid()) { return done(new error.BadRequestError()); }

  var comment = this._comment();

  comment.setData({
    comment_id: obj.data.comment_id,
    by: obj.current_user.user_id
  });
  comment.delete(function (err) {
    if (err) {
      done(err);
    }
    else {
      obj.session.set('flash_message', 'The comments have been deleted.', function (err) {
        obj.redirect(obj.config.admin_base_address + '/comments', 302);
      });
    }
  });
};

AdminCommentController.prototype._comment = function () {
  return Comment(this._commentStore);
}

function newAdminCommentController(commentStore, types) {
  var controller = new AdminCommentController();
  controller.setCommentStore(commentStore);
  controller.setTypes(types);
  return controller;
}

module.exports = newAdminCommentController;
