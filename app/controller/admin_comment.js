var Controller = require('./core');
var Comment = require('../../lib/model/comment.js');
var boundMethods = [
  'index','approve','approvePost','delete','confirmDelete'
];

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

AdminCommentController.prototype.beforeAction = function (callback, req, res) {
  req.view.layout = 'admin';
  callback(req, res);
};

AdminCommentController.prototype.index = function (req, res) {
  var limit = 10;
  var page = req.data.page ? req.data.page : 1;
  var filters;
  var comment = this._comment();

  if (!req.hasPermission(['su', 'editor'])) {
    res.render403();
    return;
  }

  req.view.template = 'admin_comments_index';
  req.view.context.filters = {
    limit: limit,
    page: page
  };
  req.view.context.types = {
    commentStatus: this._types.commentStatus.filter(function (t) { return [1,2].indexOf(t.id) !== -1; })
  };
  req.view.context.page = { title: 'Comments dashboard' };

  if (req.data.clear !== undefined) {
    req.session.set('admin_comments_index', {}, function (err) {
      req.view.context.filters = {
        limit: limit,
        page: page
      };

      if (filtersNotEmpty(req.view.context.filters)) {
        comment.find(req.view.context.filters, function (err, results) {
          req.view.context.comments = results.comments;
          req.view.context.pagination = {
            perPage: limit,
            page: page,
            pages: Math.ceil(results.count / limit)
          };
          this._view.render(req, res);
        }.bind(this));
      }
      else {
        this._view.render(req, res);
      }
    }.bind(this));
  }
  else if (Object.keys(req.data).length) {
    req.session.set('admin_comments_index', req.data, function (err) {
      req.view.context.filters = req.data;
      req.view.context.filters.page = page;
      req.view.context.filters.limit = limit;
      if (filtersNotEmpty(req.view.context.filters)) {
        comment.find(req.view.context.filters, function (err, results) {
          req.view.context.comments = results.comments;
          req.view.context.pagination = {
            perPage: limit,
            page: page,
            pages: Math.ceil(results.count / limit)
          };
          this._view.render(req, res);
        }.bind(this));
      }
      else {
        this._view.render(req, res);
      }
    }.bind(this));
  }
  else {
    req.view.context.filters = req.session.get('admin_comments_index') || {};
    req.view.context.filters.page = page;
    req.view.context.filters.limit = limit;
    if (filtersNotEmpty(req.view.context.filters)) {
      comment.find(req.view.context.filters, function (err, results) {
        if (err) {
          res.render500(err);
          return;
        }

        req.view.context.comments = results.comments;
        req.view.context.pagination = {
          perPage: limit,
          page: page,
          pages: Math.ceil(results.count / limit)
        };
        this._view.render(req, res);
      }.bind(this));
    }
    else {
      this._view.render(req, res);
    }
  }
};

AdminCommentController.prototype.approve = function (req, res) {
  if (!req.hasPermission(['su', 'editor'])) {
    res.render403();
    return;
  }

  req.view.template = 'admin_comments_approve';
  this._comment().findById(req.params.comment_id, function (err, comment) {
    if (err) {
      res.render500(err);
    }
    else if (!comment) {
      res.render404();
    }
    else if (comment.comment_status_type_id !== 1) {
      res.render400(JSON.stringify(comment));
    }
    else {
      req.view.context.comment = comment;
      req.view.context.page = { title: 'Approve comment' };
      this._view.render(req, res);
    }
  }.bind(this));
};

AdminCommentController.prototype.approvePost = function (req, res) {
  if (!req.hasPermission(['su', 'editor'])) {
    res.render403();
    return;
  }

  if (!Object.keys(req.data).length || req.data.comment_status_type_id === undefined) {
    res.render400();
    return;
  }

  if (req.data.csrf_token !== req.session.uid()) {
    res.render400();
    return;
  }

  var comment = this._comment();
  comment.setData({comment_id: req.params.comment_id, by: req.current_user.user_id, content: req.data.content});
  req.data.comment_status_type_id = +req.data.comment_status_type_id;

  comment.findById(req.params.comment_id, function (err, commentData) {
    if (err) {
      res.render500(err);
      return;
    }

    if (!commentData || commentData.comment_status_type_id !== 1) {
      res.render400();
      return;
    }

    if (req.data.comment_status_type_id === 2) {
      comment.hasChanged(function (err, changed) {
        if (err) {
          res.render500();
        }
        else if (!changed) {
          comment.approve(function (err) {
            if (err) {
              res.render500(err);
              return;
            }

            req.session.set('flash_message', 'Your comment has been approved', function (err) {
              res.redirect(req.config.admin_base_address + '/comments', 302);
            });
          }.bind(this));
        }
        else {
          comment.save(function (err) {
            if (err) {
              res.render500(err);
            }
            else {
              comment.approve(function (err) {
                if (err) {
                  res.render500(err);
                  return;
                }

                req.session.set('flash_message', 'Your comment has been approved', function (err) {
                  res.redirect(req.config.admin_base_address + '/comments', 302);
                });
              }.bind(this));
            }
          }.bind(this));
        }
      }.bind(this));
    }
    else if (req.data.comment_status_type_id === 3) {
      comment.decline(function (err) {
        if (err) {
          res.render500(err);
          return;
        }

        req.session.set('flash_message', 'Your comment has been declined', function (err) {
          res.redirect(req.config.admin_base_address + '/comments', 302);
        });
      });
    }
    else {
      res.render400();
    }
  }.bind(this));
};

AdminCommentController.prototype.delete = function (req, res) {
  if (!req.hasPermission(['su', 'editor'])) {
    res.render403();
  }
  else if (Object.keys(req.data).length === 0) {
    res.render400();
  }
  else if (req.data.csrf_token !== req.session.uid()) {
    res.render400();
  }
  else {
    req.view.template = 'admin_comments_delete';
    req.view.context.comment_ids = req.data.comment_id;
    this._view.render(req, res);
  }
};

AdminCommentController.prototype.confirmDelete = function (req, res) {
  var comment;

  if (!req.hasPermission(['su', 'editor'])) {
    res.render403();
  }
  else if (!Array.isArray(req.data.comment_id) || req.data.comment_id.length === 0) {
    res.render400();
  }
  else if (req.data.csrf_token !== req.session.uid()) {
    res.render400();
  }
  else {
    comment = this._comment();
    comment.setData({
      comment_id: req.data.comment_id,
      by: req.current_user.user_id
    });
    comment.delete(function (err) {
      if (err) {
        res.render500(err);
      }
      else {
        req.session.set('flash_message', 'The comments have been deleted.', function (err) {
          res.redirect(req.config.admin_base_address + '/comments', 302);
        });
      }
    });
  }
};

AdminCommentController.prototype._comment = function () {
  return Comment(this._commentStore);
}

function newAdminCommentController(view, commentStore, types) {
  var controller = new AdminCommentController(boundMethods);
  controller.setView(view);
  controller.setCommentStore(commentStore);
  controller.setTypes(types);
  return controller;
}

module.exports = newAdminCommentController;
