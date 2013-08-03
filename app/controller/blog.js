var Controller = require('./core');
var Post = require('../../lib/models/post.js');
var Tag = require('../../lib/models/tag.js');
var Comment = require('../../lib/models/comment.js');
var S = require('string');
var boundMethods = [
  'home', 'view', 'index', 'tag', 'tags', 'newCommentPost'
];

function BlogController() {
  Controller.apply(this, arguments);
}

BlogController.prototype = Object.create(Controller.prototype, { constructor: BlogController });

BlogController.prototype.setPostData = function (postData) {
  this._postData = postData;
};

BlogController.prototype.setTagData = function (tagData) {
  this._tagData = tagData;
};

BlogController.prototype.setCommentData = function (commentData) {
  this._commentData = commentData;
};

BlogController.prototype.home = function (req, res) {
  res.setHeader('Cache-control', 'no-cache,max-age=0');
  this._newPost().getLatest(3, function (err, posts) {
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
  res.setHeader('Cache-control', 'no-cache,max-age=0');
  this._newPost().getLatest(null, function (err, posts) {
    if (err) {
      res.render500(err);
    }
    else {
      req.view.template = 'blog_index';
      req.view.context.posts = posts;
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
  var tag = this._newTag();
  var post = this._newPost();

  tag.findByName(req.params.name, function (err, tag) {
    if (err) {
      res.render500(err);
    }
    else if (!tag || tag.post_count === 0) {
      res.render404();
    }
    else {
      post.setData({
        tag_id: tag.tag_id,
        start: start,
        limit: limit
      });
      post.getPostsByTagId(function (err, posts) {
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
  this._newTag().allWithPosts(function (err, tags) {
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
  this._newPost().getBySlug(req.params.slug, function (err, post) {
    if (err) {
      res.render500(err);
    }
    else {
      var comment = this._newComment();
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
    comment = this._newComment();
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
        comment.save(function (err, tag_id) {
          if (err) {
            res.render500(err);
          }
          else {
            req.session.set('flash_message', 'Your comment has been submitted and will be reviewed.', function (err) {
              this.view(req, res);
            }.bind(this));
          }
        }.bind(this));
      }
    }.bind(this));
  }
};

BlogController.prototype._newPost = function () {
  var post = new Post();
  post.setPostData(this._postData);
  return post;
};

BlogController.prototype._newTag = function () {
  var tag = new Tag();
  tag.setTagData(this._tagData);
  return tag;
};

BlogController.prototype._newComment = function () {
  var comment = new Comment();
  comment.setCommentData(this._commentData);
  return comment;
};

function newBlogController(view, postData, tagData, commentData) {
  var controller = new BlogController(boundMethods);
  controller.setView(view);
  controller.setPostData(postData);
  controller.setCommentData(commentData);
  controller.setTagData(tagData);
  return controller;
}

module.exports = newBlogController;
