var Controller = require('./core');
var Post = require('../model/post.js');
var PostStatus = require('../model/post_status.js');
var Bookshelf = require('bookshelf').PG;

function TestController() {
  Controller.apply(this, arguments);
  this._routes = [
    ['get', '/tests', this.test.bind(this)],
  ];
}

TestController.prototype = Object.create(Controller.prototype, { constructor: TestController });

TestController.prototype.test = function (obj, done) {
  obj.headers = {
    'cache-control': 'no-cache,max-age=0'
  }

  //var post = new Post({
    //post_id: 138,
    //slug: 'this-is-a-test',
    //title: 'This is a test',
    //content: 'Content of this test',
    //published: new Date(),
    //user_id: 4,
    //location: [ 55, 0.1 ]
  //});
  //var postStatusData = {
    //post_status_type_id: 1,
    //user_id: 2
  //};

  //post
    //.save()
    //.then(post.attachPostStatus(postStatusData))
    //.exec(function (err, post) {
      //if (err) { console.error(err); return done(err); }

      //console.log(post.toJSON());
      //obj.output = 'success';
      //done(null, obj);
    //});

  var post = new Post({ post_id: 112 });
  post.related('comments').fetch().exec(function (err, post) {
    if (err) { console.error(err); return done(err); }

    console.log(post.toJSON());
    obj.output = 'success';
    done(null, obj);
  });
};

function newTestController() {
  var controller = new TestController();
  return controller;
}

module.exports = newTestController;
