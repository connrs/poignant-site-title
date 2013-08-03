var Controller = require('./core');
var Comment = require('../../lib/models/comment.js');
var boundMethods = [
  'index','approve','approvePost','delete','confirmDelete'
];

function filtersNotEmpty(filters) {
  var f;

  for (f in filters) {
    if (filters.hasOwnProperty(f) && filters[f] !== '' && filters[f] !== null && filters[f] !== undefined) {
      return true;
    }
  }

  return false;
}

function AdminCommentController() {
  Controller.apply(this, arguments);
}

AdminCommentController.prototype = Object.create(Controller.prototype, { constructor: AdminCommentController });

AdminCommentController.prototype.setTypes = function (types) {
  this._types = types;
};

AdminCommentController.prototype.setCommentData = function (commentData) {
  this._commentData = commentData;
};

AdminCommentController.prototype.index = function (req, res) {
  var filters;
  var comment = this._newComment();

  if (!req.hasPermission(['su', 'editor'])) {
    res.render403();
    return;
  }

  req.view.template = 'admin_comments_index';
  req.view.context.filters = {};
  req.view.context.types = {
    commentStatus: this._types.commentStatus.filter(function (t) { return [1,2].indexOf(t.id) !== -1; })
  };
  req.view.context.page = { title: 'Comments dashboard' };

  if (req.data.clear !== undefined) {
    req.session.set('admin_comments_index', {}, function (err) {
      req.view.context.filters = {};

      if (filtersNotEmpty(req.view.context.filters)) {
        comment.find(req.view.context.filters, function (err, comments) {
          req.view.context.comments = comments;
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
      if (filtersNotEmpty(req.view.context.filters)) {
        comment.find(req.view.context.filters, function (err, comments) {
          req.view.context.comments = comments;
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
    if (filtersNotEmpty(req.view.context.filters)) {
      comment.find(req.view.context.filters, function (err, comments) {
        req.view.context.comments = comments;
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
  this._newComment().findById(req.params.comment_id, function (err, comment) {
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

  console.log(req.data);
  if (req.data.csrf_token !== req.session.uid()) {
    res.render400();
    return;
  }

  var comment = this._newComment();
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

AdminCommentController.prototype.new = function (req, res) {
  if (!req.hasPermission()) {
    res.render403();
    return;
  }

  req.view.template = 'admin_blog_new';
  req.view.context.page = { title: 'New post' };
  this._view.render(req, res);
};

AdminCommentController.prototype.newPost = function (req, res) {
  var post;

  if (!req.current_user || !req.current_user.role_id) {
    res.render403();
    return;
  }

  if (Object.keys(req.data).length === 0) {
    req.view.errors = { general: 'No data submitted' };
    this.new(req, res);
    return;
  }

  if (req.data.csrf_token !== req.session.uid()) {
    res.render400();
    return;
  }

  req.data.post_status_type_id = +req.data.post_status_type_id;
  req.data.by = req.current_user.user_id;
  post = this._newPost();
  post.setData(req.data);
  post.validate(function (err, validationErrors) {
    if (err) {
      res.render500(err);
      return;
    }

    if (validationErrors !== false) {
      req.view.context.post = req.data;
      req.view.context.errors = validationErrors;
      this.new(req, res);
      return;
    }

    post.save(function (err, post_id) {
      if (err) {
        res.render500(err);
        return;
      }

      if (req.data.post_status_type_id === 2) {
        if (req.current_user.role_id === 1) {
          req.session.set('flash_message', 'Please approve your post now to publish it.', function (err) {
            res.redirect(req.config.admin_base_address + '/posts/approve/' + post_id, 302);
          });
        }
        else {
          req.session.set('flash_message', 'Your post has been submitted for approval.', function (err) {
            res.redirect(req.config.admin_base_address + '/posts', 302);
          });
        }
      }
      else if (req.data.post_status_type_id === 1) {
        req.session.set('flash_message', 'Your post has been saved for later.', function (err) {
          res.redirect(req.config.admin_base_address + '/posts', 302);
        });
      }
    });
  }.bind(this));
};

AdminCommentController.prototype.delete = function (req, res) {
  var post;

  if (!req.hasPermission(['su', 'editor'])) {
    res.render403();
    return;
  }

  if (Object.keys(req.data).length === 0) {
    res.render400();
    return;
  }

  if (req.data.csrf_token !== req.session.uid()) {
    res.render400();
    return;
  }

  req.view.template = 'admin_blog_delete';
  req.view.context.post_ids = req.data.post_id;
  this._view.render(req, res);
};

AdminCommentController.prototype.confirmDelete = function (req, res) {
  var post;

  if (!req.hasPermission(['su', 'editor'])) {
    res.render403();
    return;
  }

  if (Object.prototype.toString.call(req.data.post_id) !== '[object Array]' || req.data.post_id.length === 0) {
    res.render400();
    return;
  }

  if (req.data.csrf_token !== req.session.uid()) {
    res.render400();
    return;
  }

  post = this._newPost();
  post.setData({
    post_id: req.data.post_id,
    by: req.current_user.user_id
  });
  post.delete(function (err) {
    if (err) {
      res.render500(err);
      return;
    }

    req.session.set('flash_message', 'The posts have been deleted.', function (err) {
      res.redirect(req.config.admin_base_address + '/posts', 302);
    });
  });
};

AdminCommentController.prototype._newComment = function () {
  var comment = new Comment();
  comment.setCommentData(this._commentData);
  return comment;
};

function newAdminCommentController(view, commentData, types) {
  var controller = new AdminCommentController(boundMethods);
  controller.setView(view);
  controller.setCommentData(commentData);
  controller.setTypes(types);
  return controller;
}

module.exports = newAdminCommentController;
