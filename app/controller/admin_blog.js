var Controller = require('./core');
var Post = require('../model/post.js');
var Posts = require('../collection/posts.js');
var Tag = require('../model/tag.js');
var Tags = require('../collection/tags.js');
var LegacyPost = require('../../lib/model/post.js');
var LegacyTag = require('../../lib/model/tag.js');
var newPostPath = 'new_post';
var amendedPostPath = 'amended_post';
var approvedPostPath = 'approved_post';
var HTTPError = require('http-errors');

function AdminBlogController() {

  Controller.apply(this, arguments);
  this._routes = [
    ['all', '/admin/posts', {
      action: this._actionStream('index'),
      formFilters: this._formFilterStream('admin_blog_index', {
        limit: 10,
        page: 1
      }),
      template: this._templateStream('admin', 'admin_blog_index')
    }],
    ['head', '/admin/posts', {
      action: this._actionStream('index'),
      formFilters: this._formFilterStream('admin_blog_index', {
        limit: 20,
        page: 1
      }),
      template: this._templateStream('admin', 'admin_blog_index')
    }],
    ['get', '/admin/posts/new', {
      action: this._actionStream('addNew'),
      template: this._templateStream('admin', 'admin_blog_new')
    }],
    ['head', '/admin/posts/new', {
      action: this._actionStream('addNew')
    }],
    ['post', '/admin/posts/new', {
      action: this._actionStream('newPost')
    }],
    ['get', '/admin/posts/edit/:post_id', {
      action: this._actionStream('edit'),
      template: this._templateStream('admin', 'admin_blog_edit')
    }],
    ['head', '/admin/posts/edit/:post_id', {
      action: this._actionStream('edit'),
      template: this._templateStream('admin', 'admin_blog_edit')
    }],
    ['post', '/admin/posts/edit/:post_id', {
      action: this._actionStream('editPost')
    }],
    ['get', '/admin/posts/approve', {
      action: this._actionStream('approveDashboard')
    }],
    ['head', '/admin/posts/approve', {
      action: this._actionStream('approveDashboard')
    }],
    ['get', '/admin/posts/approve/:post_id', {
      action: this._actionStream('approve'),
      template: this._templateStream('admin', 'admin_blog_approve_post')
    }],
    ['head', '/admin/posts/approve/:post_id', {
      action: this._actionStream('approve'),
      template: this._templateStream('admin', 'admin_blog_approve_post')
    }],
    ['post', '/admin/posts/approve/:post_id', {
      action: this._actionStream('approvePost')
    }],
    ['post', '/admin/posts/delete', {
      action: this._actionStream('deletePost'),
      template: this._templateStream('admin', 'admin_blog_delete')
    }],
    ['post', '/admin/posts/confirm_delete', {
      action: this._actionStream('confirmDelete')
    }]
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
  var post = this._post();
  var context = {
    current_navigation: 'admin_blog_index',
    page: { title: 'Posts dashboard' },
    types: {
      postStatus: this._types.postStatus.filter(function (t) { return [1,3].indexOf(t.id) !== -1; })
    },
    filters: obj.formFilters || {}
  };

  obj.headers = {
    'cache-control': 'no-cache'
  }

  if (!obj.hasPermission()) { return done(new HTTPError.NotAuthorizedError()); }

  post.find(context.filters, function (err, results) {
    context.posts = results.posts;
    context.pagination = {
      perPage: context.filters.limit,
      page: context.filters.page || 1,
      pages: Math.ceil(results.count / context.filters.limit)
    };
    obj.context = context;
    done(null, obj);
  }.bind(this));
};

AdminBlogController.prototype.edit = function (obj, done) {
  var post;

  if (!obj.hasPermission()) { return done(new HTTPError.NotAuthorizedError()); }

  obj.context = {
    current_navigation: 'admin_blog_edit'
  };

  if (obj.data.post) {
    obj.context.post = obj.data.post;
    return done(null, obj);
  }

  post = this._post();
  post.findById(obj.params.post_id, function (err, post) {
    if (err) { return done(err); }

    if (!obj.hasPermission(['su', 'editor']) && post.inserted_by !== obj.current_user.user_id) { return done(new HTTPError.NotAuthorizedError()); }

    if (post.can_edit !== 1) { return done(new HTTPError.BadRequestError()); }

    obj.context.post = post;
    obj.context.page = { title: 'Edit post - ' + post.title };
    done(null, obj);
  }.bind(this));
};

AdminBlogController.prototype.editPost = function (obj, done) {
  if (!obj.hasPermission()) { return done(new HTTPError.NotAuthorizedError()); }

  if (Object.keys(obj.data).length === 0) { return done(new HTTPError.BadRequestError()); }

  if (obj.data.csrf_token !== obj.session.uid()) { return done(new HTTPError.BadRequestError()); }

  var post = this._post();
  obj.data.post_status_type_id = +obj.data.post_status_type_id;
  obj.data.by = obj.current_user.user_id;
  post.setData(obj.data);

  if (obj.data.post_status_type_id === 1) {
    post.findById(obj.data.post_id, function (err, postData) {
      if (err) { return done(err); }

      if (!obj.hasPermission(['su', 'editor']) && postData.inserted_by !== obj.current_user.user_id) { return done(new HTTPError.NotAuthorizedError()); }

      if (postData.post_status_type_id !== 1) { return done(new HTTPError.BadRequestError('You are not permitted to perform that action')); }

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

      if (!postData) { return done(new HTTPError.NotFoundError()); };

      if (!obj.hasPermission(['su', 'editor']) && postData.inserted_by !== obj.current_user.user_id) { return done(new HTTPError.NotAuthorizedError()); }

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
    done(new HTTPError.NotAuthorizedError());
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
  if (!obj.hasPermission(['su', 'editor'])) { return done(new HTTPError.NotAuthorizedError()); }

  obj.context = {
    current_navigation: 'admin_blog_approve_post'
  };

  this._post().findById(obj.params.post_id, function (err, post) {
    if (err) { return done(err); }

    if (post.post_status_type_id !== 5 && post.post_status_type_id !== 2) {
      obj.redirect('/', 302);
    }
    else {
      obj.context.post = post;
      obj.context.page = { title: 'Approve post - ' + post.title };
      done(null, obj);
    }
  }.bind(this));
};

AdminBlogController.prototype.approvePost = function (obj, done) {
  if (!obj.hasPermission(['su', 'editor'])) { return done(new HTTPError.NotAuthorizedError()); }

  if (!Object.keys(obj.data).length || obj.data.post_status_type_id === undefined) { return done(new HTTPError.BadRequestError()); }

  if (obj.data.csrf_token !== obj.session.uid()) { return done(new HTTPError.BadRequestError()); }

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

AdminBlogController.prototype.addNew = function (obj, done) {
  if (!obj.hasPermission()) { return done(new HTTPError.NotAuthorizedError()); }

  obj.context = {
    current_navigation: 'admin_blog_new',
    page: { title: 'New post' }
  };
  done(null, obj);
};

AdminBlogController.prototype.newPost = function (obj, done) {
  if (!obj.current_user || !obj.current_user.role_id) { return done(new HTTPError.NotAuthorizedError()); }

  if (Object.keys(obj.data).length === 0) {
    obj.formErrors = { general: 'No data submitted' };
    return this.new(obj, done);
  }

  if (obj.data.csrf_token !== obj.session.uid()) {
    return done(new HTTPError.BadRequestError());
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

AdminBlogController.prototype.deletePost = function (obj, done) {
  if (!obj.hasPermission(['su', 'editor'])) { return done(new HTTPError.NotAuthorizedError()); }

  if (Object.keys(obj.data).length === 0) { return done(new HTTPError.BadRequestError()); }

  if (obj.data.csrf_token !== obj.session.uid()) { return done(new HTTPError.BadRequestError()); }

  obj.context = {
    current_navigation: 'admin_blog_delete',
    post_ids: obj.data.post_id
  };

  done(null, obj);
};

AdminBlogController.prototype.confirmDelete = function (obj, done) {
  if (!obj.hasPermission(['su', 'editor'])) { return done(new HTTPError.NotAuthorizedError()); }

  if (Object.prototype.toString.call(obj.data.post_id) !== '[object Array]' || obj.data.post_id.length === 0) { return done(new HTTPError.BadRequestError()); }

  if (obj.data.csrf_token !== obj.session.uid()) { return done(new HTTPError.BadRequestError()); }

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
  return LegacyPost(this._postStore);
};

AdminBlogController.prototype._tag = function () {
  return LegacyTag(this._tagStore);
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
