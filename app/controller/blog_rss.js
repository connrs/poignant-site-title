var Controller = require('./core');
var Post = require('../../lib/models/post.js');
var marked = require('marked');
var boundMethods = [
  'posts'
];

function BlogController() {
  Controller.apply(this, arguments);
}

BlogController.prototype = Object.create(Controller.prototype, { constructor: BlogController });

BlogController.prototype.setPostData = function (postData) {
  this._postData = postData;
};

BlogController.prototype.posts = function (req, res) {
  res.setHeader('Cache-control', 'no-cache,max-age=0');
  this._newPost().getLatest(10, function (err, posts) {
    var maxLastMod;

    if (err) {
      res.render500(err);
      return;
    }

    maxLastMod = Math.max.apply(null, posts.map(function (p) { return p.last_modified; }));
    req.view.context.pubDate = maxLastMod;
    req.view.context.items = posts.map(function (post) {
      return {
        title: post.title,
        link: req.config.base_address + '/posts/' + post.slug,
        description: marked(post.content),
        pubDate: post.published
      };
    });
    this._view.render(req, res);
  }.bind(this));
}

BlogController.prototype._newPost = function () {
  var post = new Post();
  post.setPostData(this._postData);
  return post;
};

function newBlogController(view, postData) {
  var controller = new BlogController(boundMethods);
  controller.setView(view);
  controller.setPostData(postData);
  return controller;
}

module.exports = newBlogController;
