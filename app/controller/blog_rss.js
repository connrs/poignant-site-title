var Controller = require('./core');
var RSSView = require('../view/rss.js');
var Post = require('../../lib/model/post.js');
var marked = require('marked');

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

BlogController.prototype.posts = function (obj, done) {
  obj.headers = {
    'cache-control': 'no-cache,max-age=0',
    'content-type': 'application/rss+xml; charset=utf-8'
  }
  this._post().getLatest(10, function (err, posts) {
    if (err) { return done(err); }

    var maxLastMod;
    var view = new RSSView();
    var data = {};

    maxLastMod = Math.max.apply(null, posts.map(function (p) { return p.last_modified; }));
    data.pubDate = maxLastMod;
    data.items = posts.map(function (post) {
      return {
        title: post.title,
        link: obj.config.base_address + '/posts/' + post.slug,
        description: marked(post.content),
        pubDate: post.published
      };
    });
    obj.output = view.render(obj, data);
    done(null, obj);
  }.bind(this));
}

BlogController.prototype._post = function () {
  return Post(this._postStore);
};

function newBlogController(postStore) {
  var controller = new BlogController();
  controller.setPostStore(postStore);
  return controller;
}

module.exports = newBlogController;
