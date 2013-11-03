var Controller = require('./core');
var Post = require('../../lib/model/post.js');
var marked = require('marked');
var boundMethods = [
  'posts'
];

function BlogController() {
  Controller.apply(this, arguments);
  this._routes = [
    ['get', '/posts.rss', this.posts.bind(this)],
    ['head', '/posts.rss', this.posts.bind(this)]
  ];
}

BlogController.prototype = Object.create(Controller.prototype, { constructor: BlogController });

BlogController.prototype.setPostStore = function (postStore) {
  this._postStore = postStore;
};

BlogController.prototype.posts = function (req, res) {
  res.setHeader('Cache-control', 'no-cache,max-age=0');
  this._post().getLatest(10, function (err, posts) {
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

BlogController.prototype._post = function () {
  return Post(this._postStore);
};

function newBlogController(view, postStore) {
  var controller = new BlogController(boundMethods);
  controller.setPostStore(postStore);
  controller.setView(view);
  return controller;
}

module.exports = newBlogController;
