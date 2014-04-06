var Controller = require('./core');
var Post = require('../../lib/model/post.js');
var Tag = require('../../lib/model/tag.js');
var newPostPath = 'new_post';
var amendedPostPath = 'amended_post';
var approvedPostPath = 'approved_post';
var error = require('../../lib/error/index.js');

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
  this._routes = [
    ['all', '/admin/posts', this.index.bind(this)],
    ['head', '/admin/posts', this.index.bind(this)],
    ['get', '/admin/posts/new', this.new.bind(this)],
    ['head', '/admin/posts/new', this.new.bind(this)],
    ['post', '/admin/posts/new', this.newPost.bind(this)],
    ['get', '/admin/posts/edit/:post_id', this.edit.bind(this)],
    ['head', '/admin/posts/edit/:post_id', this.edit.bind(this)],
    ['post', '/admin/posts/edit/:post_id', this.editPost.bind(this)],
    ['get', '/admin/posts/approve', this.approveDashboard.bind(this)],
    ['head', '/admin/posts/approve', this.approveDashboard.bind(this)],
    ['get', '/admin/posts/approve/:post_id', this.approve.bind(this)],
    ['head', '/admin/posts/approve/:post_id', this.approve.bind(this)],
    ['post', '/admin/posts/approve/:post_id', this.approvePost.bind(this)],
    ['post', '/admin/posts/delete', this.delete.bind(this)],
    ['post', '/admin/posts/confirm_delete', this.confirmDelete.bind(this)]
  ];
}

AdminBlogController.prototype = Object.create(Controller.prototype, { constructor: AdminBlogController });

AdminBlogController.prototype.setTypes = function (types) {
  this._types = types;
};

AdminBlogController.prototype.setPostStore = function (postStore) {
  this._postStore = postStore;
};

AdminBlogController.prototype.setTagStore = function (tagStore) {
  this._tagStore = tagStore;
};

AdminBlogController.prototype.setStompClient = function (client) {
  this._stompClient = client;
};

AdminBlogController.prototype.index = function (obj, done) {
  var template = this._template(obj, 'admin')
  var limit = 20;
  var page = obj.data.page ? obj.data.page : 1;
  var filters;
  var post = this._post();
  var context = {
    current_navigation: 'admin_blog_index'
  }

  obj.headers = {
    'cache-control': 'no-cache'
  }

  if (!obj.hasPermission()) { return done(new error.NotAuthorizedError()); }

  context.filters = {
    limit: limit,
    page: page
  };
  context.types = {
    postStatus: this._types.postStatus.filter(function (t) { return [1,3].indexOf(t.id) !== -1; })
  };
  context.page = { title: 'Posts dashboard' };

  if (obj.data.clear !== undefined) {
    obj.session.set('admin_blog_index', {}, function (err) {
      context.filters = {};

      if (filtersNotEmpty(context.filters)) {
        post.find(context.filters, function (err, results) {
          context.posts = results.posts;
          context.pagination = {
            perPage: limit,
            page: page,
            pages: Math.ceil(results.count / limit)
          };
          obj.output = template('admin_blog_index', context);
          done(null, obj);
        }.bind(this));
      }
      else {
        obj.output = template('admin_blog_index', context);
        done(null, obj);
      }
    }.bind(this));
  }
  else if (Object.keys(obj.data).length) {
    obj.session.set('admin_blog_index', obj.data, function (err) {
      context.filters.post_status_type_id = obj.data.post_status_type_id;
      context.filters.title = obj.data.title;
      if (filtersNotEmpty(context.filters)) {
        post.find(context.filters, function (err, results) {
          context.posts = results.posts;
          context.pagination = {
            perPage: limit,
            page: page,
            pages: Math.ceil(results.count / limit)
          };
          obj.output = template('admin_blog_index', context);
          done(null, obj);
        }.bind(this));
      }
      else {
        obj.output = template('admin_blog_index', context);
        done(null, obj);
      }
    }.bind(this));
  }
  else {
    context.filters = obj.session.get('admin_blog_index') || {};
    context.filters.page = page;
    context.filters.limit = limit;
    if (filtersNotEmpty(context.filters)) {
      post.find(context.filters, function (err, results) {
        context.posts = results.posts;
        context.pagination = {
          perPage: limit,
          page: page,
          pages: Math.ceil(results.count / limit)
        };
        obj.output = template('admin_blog_index', context);
        done(null, obj);
      }.bind(this));
    }
    else {
      obj.output = template('admin_blog_index', context);
      done(null, obj);
    }
  }
};

AdminBlogController.prototype.edit = function (obj, done) {
  var post;
  var template = this._template(obj, 'admin');
  var context = {
    current_navigation: 'admin_blog_edit'
  };

  if (!obj.hasPermission()) {
    return done(new error.NotAuthorizedError());
  }

  if (obj.data.post) {
    context.post = obj.data.post;
    obj.output = template(context.current_navigation, context);
    return done(null, obj);
  }

  post = this._post();
  post.findById(obj.params.post_id, function (err, post) {
    if (err) { return done(err); }

    if (!obj.hasPermission(['su', 'editor']) && post.inserted_by !== obj.current_user.user_id) { return done(new error.NotAuthorizedError()); }

    if (post.can_edit !== 1) { return done(new error.BadRequestError()); }

    context.post = post;
    context.page = { title: 'Edit post - ' + post.title };
    obj.output = template(context.current_navigation, context);
    done(null, obj);
  }.bind(this));
};

AdminBlogController.prototype.editPost = function (obj, done) {
  if (!obj.hasPermission()) { return done(new error.NotAuthorizedError()); }

  if (Object.keys(obj.data).length === 0) { return done(new error.BadRequestError()); }

  if (obj.data.csrf_token !== obj.session.uid()) { return done(new error.BadRequestError()); }

  var post = this._post();
  obj.data.post_status_type_id = +obj.data.post_status_type_id;
  obj.data.by = obj.current_user.user_id;
  post.setData(obj.data);

  if (obj.data.post_status_type_id === 1) {
    post.findById(obj.data.post_id, function (err, postData) {
      if (err) { return done(err); }

      if (!obj.hasPermission(['su', 'editor']) && postData.inserted_by !== obj.current_user.user_id) { return done(new error.NotAuthorizedError()); }

      if (postData.post_status_type_id !== 1) { return done(new error.BadRequestError('You are not permitted to perform that action')); }

      post.hasChanged(function (err, changed) {
        if (err) { return done(err); }

        if (!changed) { return obj.redirect(obj.config.admin_base_address + '/posts', 302); }

        post.validate(function (err, validationErrors) {
          if (err) { return done(err); }

          if (validationErrors !== false) {
            obj.data.post = obj.data;
            obj.formErrors = validationErrors;
            return this.edit(obj, done);
          }

          post.save(function (err) {
            if (err) { return done(err); }

            obj.session.set('flash_message', 'Your post has been saved for later.', function (err) {
              obj.redirect(obj.config.admin_base_address + '/posts', 302);
            });
          });
        }.bind(this));
      }.bind(this))
    }.bind(this));
  }
  else {
    post.findById(obj.data.post_id, function (err, postData) {
      if (err) { return done(err); }

      if (!postData) { return done(new error.NotFoundError()); };

      if (!obj.hasPermission(['su', 'editor']) && postData.inserted_by !== obj.current_user.user_id) { return done(new error.NotAuthorizedError()); }

      post.hasChanged(function (err, changed) {
        if (err) { return done(err); }

        if (!changed) { return obj.redirect(obj.config.admin_base_address + '/posts', 302); }

        post.validate(function (err, validationErrors) {
          if (err) {
            done(err);
          }
          else if (validationErrors !== false) {
            obj.data.post = obj.data;
            obj.formErrors = validationErrors;
            this.edit(obj, done);
          }
          else if (postData.post_status_type_id != 3) {
            post.save(function (err, post_id) {
              if (err) {
                done(err);
              }
              else if (obj.hasPermission(['su', 'editor'])) {
                obj.session.set('flash_message', 'Please approve your post now to publish it.', function (err) {
                  obj.redirect(obj.config.admin_base_address + '/posts/approve/' + post_id, 302);
                });
              }
              else {
                this._publishAmendedPostNotification(post_id, obj.current_user.user_id);
                obj.session.set('flash_message', 'Your post has been submitted for approval.', function (err) {
                  obj.redirect(obj.config.admin_base_address + '/posts' + post_id, 302);
                });
              }
            }.bind(this));
          }
          else {
            post.update(function (err, post_id) {
              if (err) { return done(err); }

              if (obj.hasPermission(['su', 'editor'])) {
                obj.session.set('flash_message', 'Please approve your post now to publish it.', function (err) {
                  obj.redirect(obj.config.admin_base_address + '/posts/approve/' + post_id, 302);
                });
              }
              else {
                this._publishAmendedPostNotification(post_id, obj.current_user.user_id);
                obj.session.set('flash_message', 'Your post has been submitted for approval.', function (err) {
                  obj.redirect(obj.config.admin_base_address + '/posts' + post_id, 302);
                });
              }
            });
          }
        }.bind(this));
      }.bind(this));
    }.bind(this));
  }
};

AdminBlogController.prototype.approveDashboard = function (obj, done) {
  if (!obj.hasPermission(['su', 'editor'])) {
    done(new error.NotAuthorizedError());
  }
  else {
    this._post().getUnapproved(function (err, posts) {
      if (err) {
        done(err);
      }
      else {
        var context = {
          'current_navigation': 'admin_blog_approve'
        };
        var template = this._template(obj, 'admin');

        context.posts = posts;
        context.page = { title: 'Approve posts' };
        obj.output = template(context.current_navigation, context);
        done(null, obj);
      }
    }.bind(this));
  }
};

AdminBlogController.prototype.approve = function (obj, done) {
  if (!obj.hasPermission(['su', 'editor'])) { return done(new error.NotAuthorizedError()); }

  var template = this._template(obj, 'admin');
  var context = {
    'current_navigation': 'admin_blog_approve_post'
  }

  this._post().findById(obj.params.post_id, function (err, post) {
    if (err) {
      done(err);
    }
    else if (post.post_status_type_id !== 5 && post.post_status_type_id !== 2) {
      obj.redirect('/', 302);
    }
    else {
      context.post = post;
      context.page = { title: 'Approve post - ' + post.title };
      obj.output = template(context.current_navigation, context);
      done(null, obj);
    }
  }.bind(this));
};

AdminBlogController.prototype.approvePost = function (obj, done) {
  if (!obj.hasPermission(['su', 'editor'])) { return done(new error.NotAuthorizedError()); }

  if (!Object.keys(obj.data).length || obj.data.post_status_type_id === undefined) { return done(new error.BadRequestError()); }

  if (obj.data.csrf_token !== obj.session.uid()) { return done(new error.BadRequestError()); }

  var post = this._post();

  post.setData({post_id: obj.params.post_id, by: obj.current_user.user_id});
  obj.data.post_status_type_id = +obj.data.post_status_type_id;

  post.findById(obj.params.post_id, function (err, postData) {
    if (err) { return done(err); }

    if (!postData || (postData.post_status_type_id !== 5 && postData.post_status_type_id !== 2)) { return obj.redirect(obj.config.admin_base_address + '/posts/approve', 302); }

    if (obj.data.post_status_type_id === 3) {
      post.approve(function (err) {
        if (err) { return done(err); }

        this._publishApprovedPostNotification(obj.params.post_id);
        obj.session.set('flash_message', 'Your post has been approved', function (err) {
          obj.redirect(obj.config.admin_base_address + '/posts/approve', 302);
        });
      }.bind(this));
    }
    else if (obj.data.post_status_type_id === 4) {
      post.reject(function (err) {
        if (err) { return done(err); }

        obj.session.set('flash_message', 'Your post has been rejected', function (err) {
          obj.redirect(obj.config.admin_base_address + '/posts/approve', 302);
        });
      });
    }
  }.bind(this));
};

AdminBlogController.prototype.new = function (obj, done) {
  if (!obj.hasPermission()) { return done(new error.NotAuthorizedError()); }

  var template = this._template(obj, 'admin');
  var context = {
    'current_navigation': 'admin_blog_new'
  }

  context.page = { title: 'New post' };
  obj.output = template(context.current_navigation, context);
  done(null, obj);
};

AdminBlogController.prototype.newPost = function (obj, done) {
  if (!obj.current_user || !obj.current_user.role_id) { return done(new error.NotAuthorizedError()); }

  if (Object.keys(obj.data).length === 0) {
    obj.formErrors = { general: 'No data submitted' };
    return this.new(obj, done);
  }

  if (obj.data.csrf_token !== obj.session.uid()) {
    return done(new error.BadRequestError());
  }

  var post;

  obj.data.post_status_type_id = +obj.data.post_status_type_id;
  obj.data.by = obj.current_user.user_id;
  post = this._post();
  post.setData(obj.data);
  post.validate(function (err, validationErrors) {
    if (err) { return done(err); }

    if (validationErrors !== false) {
      obj.data = obj.data;
      obj.formErrors = validationErrors;
      return this.new(obj, done);
    }

    post.save(function (err, post_id) {
      if (err) { return done(err); }

      if (obj.data.post_status_type_id === 2) {
        if (obj.current_user.role_id === 1) {
          obj.session.set('flash_message', 'Please approve your post now to publish it.', function (err) {
            obj.redirect(obj.config.admin_base_address + '/posts/approve/' + post_id, 302);
          });
        }
        else {
          this._publishNewPostNotification(post_id, obj.current_user.user_id);
          obj.session.set('flash_message', 'Your post has been submitted for approval.', function (err) {
            obj.redirect(obj.config.admin_base_address + '/posts', 302);
          });
        }
      }
      else if (obj.data.post_status_type_id === 1) {
        obj.session.set('flash_message', 'Your post has been saved for later.', function (err) {
          obj.redirect(obj.config.admin_base_address + '/posts', 302);
        });
      }
    }.bind(this));
  }.bind(this));
};

AdminBlogController.prototype.delete = function (obj, done) {
  if (!obj.hasPermission(['su', 'editor'])) { return done(new error.NotAuthorizedError()); }

  if (Object.keys(obj.data).length === 0) { return done(new error.BadRequestError()); }

  if (obj.data.csrf_token !== obj.session.uid()) { return done(new error.BadRequestError()); }

  var post;
  var template = this._template(obj, 'admin');
  var context = {
    'current_navigation': 'admin_blog_delete'
  }

  context.post_ids = obj.data.post_id;
  obj.output = template(context.current_navigation, context);
  done(null, obj);
};

AdminBlogController.prototype.confirmDelete = function (obj, done) {
  if (!obj.hasPermission(['su', 'editor'])) { return done(new error.NotAuthorizedError()); }

  if (Object.prototype.toString.call(obj.data.post_id) !== '[object Array]' || obj.data.post_id.length === 0) { return done(new error.BadRequestError()); }

  if (obj.data.csrf_token !== obj.session.uid()) { return done(new error.BadRequestError()); }

  var post;

  post = this._post();
  post.setData({
    post_id: obj.data.post_id,
    by: obj.current_user.user_id
  });
  post.delete(function (err) {
    if (err) { return done(err); }

    obj.session.set('flash_message', 'The posts have been deleted.', function (err) {
      obj.redirect(obj.config.admin_base_address + '/posts', 302);
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

AdminBlogController.prototype._publishApprovedPostNotification = function (post_id) {
  this._stompClient.publish('/queue/' + approvedPostPath, JSON.stringify({
    post_id: post_id
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

AdminBlogController.prototype._post = function () {
  return Post(this._postStore);
};

AdminBlogController.prototype._tag = function () {
  return Tag(this._tagStore);
};

function newAdminBlogController(postStore, tagStore, types, stomp) {
  var controller = new AdminBlogController();
  controller.setPostStore(postStore);
  controller.setTagStore(tagStore);
  controller.setTypes(types);
  controller.setStompClient(stomp);
  return controller;
}

module.exports = newAdminBlogController;
