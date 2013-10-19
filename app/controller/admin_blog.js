var Controller = require('./core');
var newPostPath = 'new_post';
var amendedPostPath = 'amended_post';
var boundMethods = [
  'index','new','newPost','edit','editPost','approveDashboard','approve','approvePost','delete','confirmDelete'
];

function filtersNotEmpty(filters) {
  var f;

  for (f in filters) {
    if (filters.hasOwnProperty(f) && filters[f] !== '' && filters[f] !== null && filters[f] !== undefined && f !== 'page' && f !== 'limit') {
      return true;
    }
  }

  return false;
}

function AdminBlogController() {
  Controller.apply(this, arguments);
}

AdminBlogController.prototype = Object.create(Controller.prototype, { constructor: AdminBlogController });

AdminBlogController.prototype.setTypes = function (types) {
  this._types = types;
};

AdminBlogController.prototype.setPost = function (post) {
  this._post = post;
};

AdminBlogController.prototype.setTag = function (tag) {
  this._tag = tag;
};

AdminBlogController.prototype.setPostData = function (postData) {
  this._postData = postData;
};

AdminBlogController.prototype.setTagData = function (tagData) {
  this._tagData = tagData;
};

AdminBlogController.prototype.setStompClient = function (client) {
  this._stompClient = client;
};

AdminBlogController.prototype.beforeAction = function (callback, req, res) {
  req.view.layout = 'admin';
  callback(req, res);
};

AdminBlogController.prototype.index = function (req, res) {
  var limit = 20;
  var page = req.data.page ? req.data.page : 1;
  var filters;
  var post = this._newPost();

  res.setHeader('Cache-Control', 'no-cache');
  if (!req.hasPermission()) {
    res.render403();
    return;
  }

  req.view.template = 'admin_blog_index';
  req.view.context.filters = {
    limit: limit,
    page: page
  };
  req.view.context.types = {
    postStatus: this._types.postStatus.filter(function (t) { return [1,3].indexOf(t.id) !== -1; })
  };
  req.view.context.page = { title: 'Posts dashboard' };

  if (req.data.clear !== undefined) {
    req.session.set('admin_blog_index', {}, function (err) {
      req.view.context.filters = {};

      if (filtersNotEmpty(req.view.context.filters)) {
        post.find(req.view.context.filters, function (err, results) {
          req.view.context.posts = results.posts;
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
    req.session.set('admin_blog_index', req.data, function (err) {
      req.view.context.filters.post_status_type_id = req.data.post_status_type_id;
      req.view.context.filters.title = req.data.title;
      if (filtersNotEmpty(req.view.context.filters)) {
        post.find(req.view.context.filters, function (err, results) {
          req.view.context.posts = results.posts;
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
    req.view.context.filters = req.session.get('admin_blog_index') || {};
    req.view.context.filters.page = page;
    req.view.context.filters.limit = limit;
    if (filtersNotEmpty(req.view.context.filters)) {
      post.find(req.view.context.filters, function (err, results) {
          req.view.context.posts = results.posts;
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

AdminBlogController.prototype.edit = function (req, res) {
  var post;

  if (!req.hasPermission()) {
    res.render403();
    return;
  }

  req.view.template = 'admin_blog_edit';

  if (req.view.context.post) {
    this._view.render(req, res);
    return;
  }

  post = this._newPost();
  post.findById(req.params.post_id, function (err, post) {
    if (err) {
      res.render500(err);
      return;
    }

    if (!req.hasPermission(['su', 'editor']) && post.inserted_by !== req.current_user.user_id) {
      res.render403();
      return;
    }

    if (post.can_edit !== 1) {
      res.render400();
      return;
    }

    req.view.context.post = post;
    req.view.context.page = { title: 'Edit post - ' + post.title };
    this._view.render(req, res);
  }.bind(this));
};

AdminBlogController.prototype.editPost = function (req, res) {
  if (!req.hasPermission()) {
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

  var post = this._newPost();
  req.data.post_status_type_id = +req.data.post_status_type_id;
  req.data.by = req.current_user.user_id;
  post.setData(req.data);

  if (req.data.post_status_type_id === 1) {
    post.findById(req.data.post_id, function (err, postData) {
      if (err) {
        res.render500(err);
        return;
      }

      if (!req.hasPermission(['su', 'editor']) && postData.inserted_by !== req.current_user.user_id) {
        res.render403();
        return;
      }

      if (postData.post_status_type_id !== 1) {
        res.render400(new Error('You are not permitted to perform that action.'))
        return;
      }

      post.hasChanged(function (err, changed) {
        if (err) {
          res.render500(err);
          return;
        }

        if (!changed) {
          res.redirect(req.config.admin_base_address + '/posts', 302);
          return;
        }

        post.validate(function (err, validationErrors) {
          if (err) {
            res.render500(err);
            return;
          }

          if (validationErrors !== false) {
            req.view.context.post = req.data;
            req.view.context.errors = validationErrors;
            this.edit(req, res);
            return;
          }

          post.save(function (err) {
            if (err) {
              res.render500(err);
              return;
            }

            req.session.set('flash_message', 'Your post has been saved for later.', function (err) {
              res.redirect(req.config.admin_base_address + '/posts', 302);
            });
          });
        }.bind(this));
      }.bind(this))
    }.bind(this));
  }
  else {
    post.findById(req.data.post_id, function (err, postData) {
      if (err) {
        res.render500(err);
        return;
      }

      if (!postData) {
        res.render404();
        return;
      };

      if (!req.hasPermission(['su', 'editor']) && postData.inserted_by !== req.current_user.user_id) {
        res.render403();
        return;
      }

      post.hasChanged(function (err, changed) {
        if (err) {
          res.render500(err);
          return;
        }

        if (!changed) {
          res.redirect(req.config.admin_base_address + '/posts', 302);
          return;
        }

        post.validate(function (err, validationErrors) {
          if (err) {
            res.render500(err);
          }
          else if (validationErrors !== false) {
            req.view.context.post = req.data;
            req.view.context.errors = validationErrors;
            this.edit(req, res);
          }
          else if (postData.post_status_type_id != 3) {
            post.save(function (err, post_id) {
              if (err) {
                res.render500(err);
              }
              else if (req.hasPermission(['su', 'editor'])) {
                req.session.set('flash_message', 'Please approve your post now to publish it.', function (err) {
                  res.redirect(req.config.admin_base_address + '/posts/approve/' + post_id, 302);
                });
              }
              else {
                this._publishAmendedPostNotification(post_id, req.current_user.user_id);
                req.session.set('flash_message', 'Your post has been submitted for approval.', function (err) {
                  res.redirect(req.config.admin_base_address + '/posts' + post_id, 302);
                });
              }
            }.bind(this));
          }
          else {
            post.update(function (err, post_id) {
              if (err) {
                res.render500(err);
                return;
              }

              if (req.hasPermission(['su', 'editor'])) {
                req.session.set('flash_message', 'Please approve your post now to publish it.', function (err) {
                  res.redirect(req.config.admin_base_address + '/posts/approve/' + post_id, 302);
                });
              }
              else {
                this._publishAmendedPostNotification(post_id, req.current_user.user_id);
                req.session.set('flash_message', 'Your post has been submitted for approval.', function (err) {
                  res.redirect(req.config.admin_base_address + '/posts' + post_id, 302);
                });
              }
            });
          }
        }.bind(this));
      }.bind(this));
    }.bind(this));
  }
};

AdminBlogController.prototype.approveDashboard = function (req, res) {
  if (!req.hasPermission(['su', 'editor'])) {
    res.render403();
  }
  else {
    this._newPost().getUnapproved(function (err, posts) {
      if (err) {
        res.render500(err);
      }
      else {
        req.view.template = 'admin_blog_approve';
        req.view.context.posts = posts;
        req.view.context.page = { title: 'Approve posts' };
        this._view.render(req, res);
      }
    }.bind(this));
  }
};

AdminBlogController.prototype.approve = function (req, res) {
  if (!req.hasPermission(['su', 'editor'])) {
    res.render403();
    return;
  }

  req.view.template = 'admin_blog_approve_post';
  this._newPost().findById(req.params.post_id, function (err, post) {
    if (err) {
      res.render500(err);
    }
    else if (!post) {
      res.end(req.params.post_id);
    }
    else if (post.post_status_type_id !== 5 && post.post_status_type_id !== 2) {
      res.redirect('/', 302);
    }
    else {
      req.view.context.post = post;
      req.view.context.page = { title: 'Approve post - ' + post.title };
      this._view.render(req, res);
    }
  }.bind(this));
};

AdminBlogController.prototype.approvePost = function (req, res) {
  if (!req.hasPermission(['su', 'editor'])) {
    res.render403();
    return;
  }

  if (!Object.keys(req.data).length || req.data.post_status_type_id === undefined) {
    res.render400();
    return;
  }

  if (req.data.csrf_token !== req.session.uid()) {
    res.render400();
    return;
  }

  var post = this._newPost();
  post.setData({post_id: req.params.post_id, by: req.current_user.user_id});
  req.data.post_status_type_id = +req.data.post_status_type_id;

  post.findById(req.params.post_id, function (err, postData) {
    if (err) {
      res.render500(err);
      return;
    }

    if (!postData || (postData.post_status_type_id !== 5 && postData.post_status_type_id !== 2)) {
      res.redirect(req.config.admin_base_address + '/posts/approve', 302);
      return;
    }

    if (req.data.post_status_type_id === 3) {
      post.approve(function (err) {
        if (err) {
          res.render500(err);
          return;
        }

        req.session.set('flash_message', 'Your post has been approved', function (err) {
          res.redirect(req.config.admin_base_address + '/posts/approve', 302);
        });
      });
    }
    else if (req.data.post_status_type_id === 4) {
      post.reject(function (err) {
        if (err) {
          res.render500(err);
          return;
        }

        req.session.set('flash_message', 'Your post has been rejected', function (err) {
          res.redirect(req.config.admin_base_address + '/posts/approve', 302);
        });
      });
    }
  }.bind(this));
};

AdminBlogController.prototype.new = function (req, res) {
  if (!req.hasPermission()) {
    res.render403();
    return;
  }

  req.view.template = 'admin_blog_new';
  req.view.context.page = { title: 'New post' };
  this._view.render(req, res);
};

AdminBlogController.prototype.newPost = function (req, res) {
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
          this._publishNewPostNotification(post_id, req.current_user.user_id);
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
    }.bind(this));
  }.bind(this));
};

AdminBlogController.prototype.delete = function (req, res) {
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

AdminBlogController.prototype.confirmDelete = function (req, res) {
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

AdminBlogController.prototype._publishNewPostNotification = function (post_id, by) {
  this._stompClient.publish('/queue/' + newPostPath, JSON.stringify({
    post_id: post_id,
    by: by
  }), {
    'content-type': 'application/json'
  });
};

AdminBlogController.prototype._publishAmendedPostNotification = function (post_id, by) {
  this._stompClient.publish('/queue/' + amendedPostPath, JSON.stringify({
    post_id: post_id,
    by: by
  }), {
    'content-type': 'application/json'
  });
};

AdminBlogController.prototype._newPost = function () {
  var post = new this._post();
  post.setPostData(this._postData);
  post.setTagData(this._tagData);
  return post;
};

AdminBlogController.prototype._newTag = function () {
  var tag = new this._tag();
  tag.setTagData(this._tagData);
  return tag;
};

function newAdminBlogController(view, post, postData, tag, tagData, types, stomp) {
  var controller = new AdminBlogController(boundMethods);
  controller.setView(view);
  controller.setPost(post);
  controller.setPostData(postData);
  controller.setTag(tag);
  controller.setTagData(tagData);
  controller.setTypes(types);
  controller.setStompClient(stomp);
  return controller;
}

module.exports = newAdminBlogController;
