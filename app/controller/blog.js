var Controller = require('./core');
var Post = require('../../lib/model/post.js');
var Tag = require('../../lib/model/tag.js');
var Comment = require('../../lib/model/comment.js');
var S = require('string');
var HTTPError = require('http-errors');
var commentPath = 'comment';

function BlogController() {
  Controller.apply(this, arguments);
  this._routes = [
    ['get', '/', this.home.bind(this)],
    ['head', '/', this.home.bind(this)],
    ['get', '/posts/:slug', this.view.bind(this)],
    ['head', '/posts/:slug', this.view.bind(this)],
    ['post', '/posts/:slug', this.newCommentPost.bind(this)],
    ['get', '/archives', this.index.bind(this)],
    ['head', '/archives', this.index.bind(this)],
    ['get', '/archives/:page', this.index.bind(this)],
    ['head', '/archives/:page', this.index.bind(this)],
    ['get', '/tags', this.tags.bind(this)],
    ['head', '/tags', this.tags.bind(this)],
    ['get', '/tags/:name', this.tag.bind(this)],
    ['head', '/tags/:name', this.tag.bind(this)],
    ['get', '/tags/:name/:page', this.tag.bind(this)],
    ['head', '/tags/:name/:page', this.tag.bind(this)]
  ];
}

BlogController.prototype = Object.create(Controller.prototype, { constructor: BlogController });

BlogController.prototype.setPostStore = function (postStore) {
  this._postStore = postStore;
};

BlogController.prototype.setTagStore = function (tagStore) {
  this._tagStore = tagStore;
};

BlogController.prototype.setCommentStore = function (commentStore) {
  this._commentStore = commentStore;
};

BlogController.prototype.setStompClient = function (client) {
  this._stompClient = client;
};

BlogController.prototype.home = function (obj, done) {
  var template = this._template(obj, 'default');
  obj.headers = {
    'cache-control': 'no-cache,max-age=0'
  };
  this._post().getLatest(3, function (err, posts) {
    if (err) { return done(err); }

    obj.output = template('blog_home', {
      posts: posts
    });
    done(null, obj);
  }.bind(this));
}

BlogController.prototype.index = function (obj, done) {
  var template = this._template(obj, 'default');
  var limit = 20;
  var page = obj.params.page ? obj.params.page : 1;
  var filters = {
    post_status_type_id: 3,
    limit: limit,
    page: page
  };

  obj.header = {
    'cache-control': 'no-cache,max-age=0'
  };
  this._post().find(filters, function (err, results) {
    if (err) {
      done(err);
    }
    else if (Math.ceil(results.count / limit) < page) {
      done(new HTTPError.NotFoundError());
    }
    else {
      obj.output = template('blog_index', {
        posts: results.posts,
        pagination: {
          url: obj.config.base_address + '/archives',
          perPage: limit,
          page: page,
          pages: Math.ceil(results.count / limit)
        },
        page: {
          title: 'Archives'
        }
      });
      done(null, obj);
    }
  }.bind(this));
}

BlogController.prototype.tag = function (obj, done) {
  var template = this._template(obj, 'default');
  var limit = 10;
  var start = obj.params.page ? (obj.params.page - 1) * limit : 0;
  var tag = this._tag();
  var post = this._post();

  tag.findByName(obj.params.name, function (err, tag) {
    if (err) {
      done(err);
    }
    else if (!tag || tag.post_count === 0) {
      done(new HTTPError.NotFoundError());
    }
    else {
      var data = {
        post_status_type_id: 3,
        tag_id: tag.tag_id,
        start: start,
        limit: limit
      };
      post.find(data, function (err, posts) {
        if (err) {
          done(err);
        }
        else if (!posts.length) {
          done(new HTTPError.BadRequestError())
        }
        else {
          obj.output = template('blog_tag', {
            page: {
              title: tag.pretty_name || tag.name
            },
            pagination: {
              url: obj.config.base_address + '/tags/' + tag.name,
              perPage: limit,
              page: start + 1,
              pages: Math.ceil(tag.post_count / limit)
            },
            posts: posts,
            tag: tag
          });
          done(null, obj);
        }
      }.bind(this));
    }
  }.bind(this));
};

BlogController.prototype.tags = function (obj, done) {
  var template = this._template(obj, 'default');

  this._tag().allWithPosts(function (err, tags) {
    if (err) {
      done(err);
    }
    else {
      obj.output = template('blog_tags', {
        tags: tags,
        page: {
          title: 'Tags'
        }
      });
      done(null, obj);
    }
  }.bind(this));
};

BlogController.prototype.view = function (obj, done) {
  var template = this._template(obj, 'default');

  this._post().getBySlug(obj.params.slug, function (err, post) {
    if (err) {
      done(err);
    }
    else {
      var comment = this._comment();
      comment.setData({
        post_id: post.post_id
      });
      comment.findPublished(function (err, comments) {
        if (err) {
          done(err);
        }
        else {
          obj.output = template('blog_view', {
            post: post,
            comments: comments,
            page: {
              title: post.title
            }
          });
          done(null, obj);
        }
      }.bind(this));
    }
  }.bind(this));
};

BlogController.prototype.newCommentPost = function (obj, done) {
  var template = this._template(obj, 'default');
  var comment;

  if (!obj.current_user || !obj.current_user.role_id) {
    obj.redirect('/', 302);
  }
  else if (Object.keys(obj.data).length === 0) {
    obj.formErrors = { general: 'No data submitted' };
    this.view(obj, done);
  }
  else if (obj.data.csrf_token !== obj.session.uid()) {
    done(new HTTPError.BadRequestError());
    return;
  }
  else {
    obj.data.by = obj.current_user.user_id;
    obj.data.comment_type_id = 1;
    comment = this._comment();
    comment.setData(obj.data);
    comment.validate(function (err, validationErrors) {
      if (err) {
        done(err);
      }
      else if (validationErrors !== false) {
        obj.formErrors = validationErrors;
        this.view(obj, done);
      }
      else {
        obj.data.content = S(obj.data.content).stripTags().s;
        comment.save(function (err, comment_id) {
          if (err) {
            done(err);
          }
          else {
            this._publishCommentNotification(obj.data.post_id, comment_id, obj.data.by);
            obj.session.set('flash_message', 'Your comment has been submitted and will be reviewed.', function (err) {
              obj.redirect(obj.req.url, 303);
              //this.view(obj, done);
            }.bind(this));
          }
        }.bind(this));
      }
    }.bind(this));
  }
};

BlogController.prototype._publishCommentNotification = function (post_id, comment_id, by) {
  this._stompClient.publish('/queue/' + commentPath, JSON.stringify({
    post_id: post_id,
    comment_id: comment_id,
    by: by
  }), {
    'content-type': 'application/json'
  });
};

BlogController.prototype._post = function () {
  return Post(this._postStore);
}

BlogController.prototype._tag = function () {
  return Tag(this._tagStore);
}

BlogController.prototype._comment = function () {
  return Comment(this._commentStore);
}

function newBlogController(postStore, tagStore, commentStore, stompClient) {
  var controller = new BlogController();
  controller.setPostStore(postStore);
  controller.setTagStore(tagStore);
  controller.setCommentStore(commentStore);
  controller.setStompClient(stompClient);
  return controller;
}

module.exports = newBlogController;
