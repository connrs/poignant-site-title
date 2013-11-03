var Controller = require('./core');
var Post = require('../../lib/model/post.js');
var Tag = require('../../lib/model/tag.js');
var Comment = require('../../lib/model/comment.js');
var S = require('string');
var boundMethods = [
  'home', 'view', 'index', 'tag', 'tags', 'newCommentPost'
];
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

BlogController.prototype.home = function (req, res) {
  res.setHeader('Cache-control', 'no-cache,max-age=0');
  this._post().getLatest(3, function (err, posts) {
    if (err) {
      res.render500(err);
    }
    else {
      req.view.template = 'blog_home';
      req.view.context.posts = posts;
      this._view.render(req, res);
    }
  }.bind(this));
}

BlogController.prototype.index = function (req, res) {
  var limit = 20;
  var page = req.params.page ? req.params.page : 1;
  var filters = {
    post_status_type_id: 3,
    limit: limit,
    page: page
  };

  res.setHeader('Cache-control', 'no-cache,max-age=0');
  this._post().find(filters, function (err, results) {
    if (err) {
      res.render500(err);
    }
    else if (Math.ceil(results.count / limit) < page) {
      res.render404();
    }
    else {
      req.view.template = 'blog_index';
      req.view.context.posts = results.posts;
      req.view.context.pagination = {
        url: req.config.base_address + '/archives',
        perPage: limit,
        page: page,
        pages: Math.ceil(results.count / limit)
      };
      req.view.context.page = {
        title: 'Archives'
      };
      this._view.render(req, res);
    }
  }.bind(this));
}

BlogController.prototype.tag = function (req, res) {
  var limit = 10;
  var start = req.params.page ? (req.params.page - 1) * limit : 0;
  var tag = this._tag();
  var post = this._post();

  tag.findByName(req.params.name, function (err, tag) {
    if (err) {
      res.render500(err);
    }
    else if (!tag || tag.post_count === 0) {
      res.render404();
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
          res.render500(err);
        }
        else if (!posts.length) {
          res.render400();
        }
        else {
          req.view.template = 'blog_tag';
          req.view.context.page = {
            title: tag.pretty_name || tag.name
          };
          req.view.context.pagination = {
            url: req.config.base_address + '/tags/' + tag.name,
            perPage: limit,
            page: start + 1,
            pages: Math.ceil(tag.post_count / limit)
          };
          req.view.context.posts = posts;
          req.view.context.tag = tag;
          this._view.render(req, res);
        }
      }.bind(this));
    }
  }.bind(this));
};

BlogController.prototype.tags = function (req, res) {
  this._tag().allWithPosts(function (err, tags) {
    if (err) {
      res.render500(err);
    }
    else {
      req.view.template = 'blog_tags';
      req.view.context.tags = tags;
      req.view.context.page = {
        title: 'Tags'
      };
      this._view.render(req, res);
    }
  }.bind(this));
};

BlogController.prototype.view = function (req, res) {
  this._post().getBySlug(req.params.slug, function (err, post) {
    if (err) {
      res.render500(err);
    }
    else {
      var comment = this._comment();
      comment.setData({
        post_id: post.post_id
      });
      comment.findPublished(function (err, comments) {
        if (err) {
          res.render500(err);
        }
        else {
          req.view.template = 'blog_view';
          req.view.context.post = post;
          req.view.context.comments = comments;
          req.view.context.page = {
            title: post.title
          };
          this._view.render(req, res)
        }
      }.bind(this));
    }
  }.bind(this));
};

BlogController.prototype.newCommentPost = function (req, res) {
  var comment;

  if (!req.current_user || !req.current_user.role_id) {
    res.redirect('/', 302);
  }
  else if (Object.keys(req.data).length === 0) {
    req.view.errors = { general: 'No data submitted' };
    this.new(req, res);
  }
  else if (req.data.csrf_token !== req.session.uid()) {
    res.render400();
    return;
  }
  else {
    req.data.by = req.current_user.user_id;
    req.data.comment_type_id = 1;
    comment = this._comment();
    comment.setData(req.data);
    comment.validate(function (err, validationErrors) {
      if (err) {
        res.render500(err);
      }
      else if (validationErrors !== false) {
        req.view.context.tag = req.data;
        req.view.context.errors = validationErrors;
        this.view(req, res);
      }
      else {
        req.data.content = S(req.data.content).stripTags().s;
        comment.save(function (err, comment_id) {
          if (err) {
            res.render500(err);
          }
          else {
            this._publishCommentNotification(req.data.post_id, comment_id, req.data.by);
            req.session.set('flash_message', 'Your comment has been submitted and will be reviewed.', function (err) {
              this.view(req, res);
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

function newBlogController(view, postStore, tagStore, commentStore, stompClient) {
  var controller = new BlogController(boundMethods);
  controller.setView(view);
  controller.setPostStore(postStore);
  controller.setTagStore(tagStore);
  controller.setCommentStore(commentStore);
  controller.setStompClient(stompClient);
  return controller;
}

module.exports = newBlogController;
