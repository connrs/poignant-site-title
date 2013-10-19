var Controller = require('../../core.js');
var Post = require('../../../../lib/models/post.js');
var url = require('url');
var boundMethods = [
  'index'
];
var webmentionPath = 'webmention_verify';

function WebmentionController() {
  Controller.apply(this, arguments);
}

WebmentionController.prototype = Object.create(Controller.prototype, { constructor: WebmentionController });

WebmentionController.prototype.setStompClient = function (client) {
  this._stompClient = client;
};

WebmentionController.prototype.setPostData = function (postData) {
  this._Post = this._Post.bind(this, postData);
};

WebmentionController.prototype.index = function (req, res) {
  if (!req.data.source || !req.data.target) {
      res.statusCode = 400;
      res.setHeader('content-type', 'application/json; charset=UTF-8');
      res.end(JSON.stringify({
        error: 'target_not_found',
        error_description: 'The target URI does not exist'
      }));
      return;
  }

  var slug = url.parse(req.data.target).pathname.match(/^\/posts\/(.*)/)[1] || '';
  this._Post().find({slug: slug}, function (err, post) {
    if (err) {
      res.render500(err);
    }
    else if (!post) {
      res.statusCode = 400;
      res.setHeader('content-type', 'application/json; charset=UTF-8');
      res.end(JSON.stringify({
        error: 'target_not_found',
        error_description: 'The target URI does not exist'
      }));
    }
    else {
      res.statusCode = 202;
      res.setHeader('content-type', 'application/json; charset=UTF-8');
      res.end(JSON.stringify({
        result: 'WebMention was successful'
      }));
      this._publishWebmentionNotification(post.post_id, req.data.source);
    }
  }.bind(this));
}

WebmentionController.prototype._publishWebmentionNotification = function (post_id, source) {
  this._stompClient.publish('/queue/' + webmentionPath, JSON.stringify({
    source: source,
    post_id: post_id
  }), {
    'content-type': 'application/json',
    'AMQ_SCHEDULED_DELAY': 600000
  });
};

WebmentionController.prototype._Post = function (postData) {
  var post = new Post();
  post.setPostData(postData);
  return post;
};

function newWebmentionController(view, postData, stompClient) {
  var controller = new WebmentionController(boundMethods);
  controller.setView(view);
  controller.setPostData(postData);
  controller.setStompClient(stompClient);
  return controller;
}

module.exports = newWebmentionController;
