var addTo = require('barnacle-add-to');
var redirect = require('barnacle-redirect');
var redir = function (opts) {
  return redirect(opts.response);
};
var getUserStreamBuilder = require('app/builder/get-user-stream')();
var authoriseUserStreamBuilder = require('app/builder/authorise-user-stream');
var templateStreamBuilder = require('app/builder/template-stream');
var parseFormDataStreamBuilder = require('app/builder/parse-form-data-stream')();
var flashMessages = require('barnacle-flash-messages')(['flash_message']);
var StreamActionController = require('app/controller/stream-action');

var Post = require('../model/post.js');
var Posts = require('../collection/posts.js');
var Tag = require('../model/tag.js');
var Tags = require('../collection/tags.js');
var Comment = require('../../lib/model/comment.js');
var S = require('string');
var HTTPError = require('http-errors');
var commentPath = 'comment';

function BlogController(options) {
  var sess = function (opts) {
    return options.session(opts.request, opts.response);
  };
  var addNav = function () {
    return addTo('navigation', options.navigation);
  };
  var addConfig = function () {
    return addTo('config', options.config);
  };
  StreamActionController.apply(this, arguments);

  this._routes = [
    ['get', '/', [
      parseFormDataStreamBuilder,
      sess,
      getUserStreamBuilder,
      redir,
      flashMessages,
      addNav,
      addConfig,
      this._createActionStream('home'),
      templateStreamBuilder('default', 'blog_home')
    ]],
    ['head', '/', [
      parseFormDataStreamBuilder,
      sess,
      getUserStreamBuilder,
      redir,
      this._createActionStream('home'),
      templateStreamBuilder('default', 'blog_home')
    ]],
    ['get', '/posts/:slug', [
      parseFormDataStreamBuilder,
      sess,
      getUserStreamBuilder,
      redir,
      flashMessages,
      addNav,
      addConfig,
      this._createActionStream('view'),
      templateStreamBuilder('default', 'blog_view')
    ]],
    ['head', '/posts/:slug', [
      parseFormDataStreamBuilder,
      sess,
      getUserStreamBuilder,
      redir,
      this._createActionStream('view'),
      templateStreamBuilder('default', 'blog_view')
    ]],
    //['post', '/posts/:slug', {
      //action: this._createActionStream('newCommentPost')
    //}],
    ['get', '/archives', [
      parseFormDataStreamBuilder,
      sess,
      getUserStreamBuilder,
      redir,
      flashMessages,
      addNav,
      addConfig,
      this._createActionStream('index'),
      templateStreamBuilder('default', 'blog_index')
    ]],
    ['head', '/archives', [
      parseFormDataStreamBuilder,
      sess,
      getUserStreamBuilder,
      redir,
      this._createActionStream('index'),
      templateStreamBuilder('default', 'blog_index')
    ]],
    ['get', '/archives/:page', [
      parseFormDataStreamBuilder,
      sess,
      getUserStreamBuilder,
      redir,
      flashMessages,
      addNav,
      addConfig,
      this._createActionStream('index'),
      templateStreamBuilder('default', 'blog_index')
    ]],
    ['head', '/archives/:page', [
      parseFormDataStreamBuilder,
      sess,
      getUserStreamBuilder,
      redir,
      flashMessages,
      addNav,
      addConfig,
      this._createActionStream('index'),
      templateStreamBuilder('default', 'blog_index')
    ]],
    ['get', '/tags', [
      parseFormDataStreamBuilder,
      sess,
      getUserStreamBuilder,
      redir,
      flashMessages,
      addNav,
      addConfig,
      this._createActionStream('tags'),
      templateStreamBuilder('default', 'blog_tags')
    ]],
    ['head', '/tags', [
      parseFormDataStreamBuilder,
      sess,
      getUserStreamBuilder,
      redir,
      this._createActionStream('tags'),
      templateStreamBuilder('default', 'blog_tags')
    ]],
    ['get', '/tags/:name', [
      parseFormDataStreamBuilder,
      sess,
      getUserStreamBuilder,
      redir,
      flashMessages,
      addNav,
      addConfig,
      this._createActionStream('tag'),
      templateStreamBuilder('default', 'blog_tag')
    ]],
    ['head', '/tags/:name', [
      parseFormDataStreamBuilder,
      sess,
      getUserStreamBuilder,
      redir,
      this._createActionStream('tag'),
      templateStreamBuilder('default', 'blog_tag')
    ]],
    ['get', '/tags/:name/:page', [
      parseFormDataStreamBuilder,
      sess,
      getUserStreamBuilder,
      redir,
      flashMessages,
      addNav,
      addConfig,
      this._createActionStream('tag'),
      templateStreamBuilder('default', 'blog_tag')
    ]],
    ['head', '/tags/:name/:page', [
      parseFormDataStreamBuilder,
      sess,
      getUserStreamBuilder,
      redir,
      this._createActionStream('tag'),
      templateStreamBuilder('default', 'blog_tag')
    ]]
  ];
}

BlogController.prototype = Object.create(StreamActionController.prototype, { constructor: BlogController });

BlogController.prototype.setCommentStore = function (commentStore) {
  this._commentStore = commentStore;
};

BlogController.prototype.setStompClient = function (client) {
  this._stompClient = client;
};

BlogController.prototype.home = function (obj, done) {
  Posts.getLatest(3).exec(function (err, posts) {
    if (err) return done(err);

    obj.headers = {
      'cache-control': 'no-cache,max-age=0'
    };
    obj.context = {
      posts: posts.toJSON()
    }
    done(null, obj);
  });
}

BlogController.prototype.index = function (obj, done) {
  var limit = 20;
  var page = obj.params.page ? obj.params.page : 1;
  var offset = (page - 1) * limit;

  obj.header = {
    'cache-control': 'no-cache,max-age=0'
  };
  Posts.count({ post_status_type_id: 3 }).exec(function (err, count) {
    if (err) { return done(err); }

    Posts.forge().query({ limit: limit, offset: offset }).fetch({ post_status_type_id: 3 }).exec(function (err, posts) {
      if (err) { return done(err); }

      if (!posts.length) { return done(new HTTPError.NotFoundError()); }

      obj.context = {
        posts: posts.toJSON(),
        pagination: {
          url: obj.config.base_address + '/archives',
          perPage: limit,
          page: page,
          pages: Math.ceil(count / limit)
        },
        page: {
          title: 'Archives'
        }
      };
      done(null, obj);
    });
  });
}

BlogController.prototype.tag = function (obj, done) {
  var limit = 10;
  var page = +(obj.params.page ? obj.params.page : 1);
  var offset = (page - 1) * limit;

  Tag
    .forge({ name: obj.params.name })
    .fetch()
    .then(Tag.postCount({ post_status_type_id: 3 }))
    .then(function (tag) {
      if (!tag || !tag.get('post_count')) {
        throw new HTTPError.NotFoundError();
      }

      return tag;
    })
    .exec(function (err, tag) {
      if (err) { return done(err); }

      tag.posts().query({ limit: limit, offset: offset }).fetch({ post_status_type_id: 3 }).exec(function (err, posts) {
        if (err) { return done(err); }

        obj.context = {
          page: {
            title: tag.get('pretty_name') || tag.get('name')
          },
          pagination: {
            url: obj.config.base_address + '/tags/' + tag.get('name'),
            perPage: limit,
            page: page,
            pages: Math.ceil(tag.get('post_count') / limit)
          },
          posts: posts.toJSON(),
          tag: tag.toJSON()
        };
        done(null, obj);
      });
  });
};

BlogController.prototype.tags = function (obj, done) {
  Tags
    .forge()
    .query('where', 'post_count', '>', 0)
    .fetch()
    .exec(function (err, tags) {
      if (err) { return done(err); }

      obj.context = {
        tags: tags.toJSON(),
        page: {
          title: 'Tags'
        }
      };
      done(null, obj);
    });
};

BlogController.prototype.view = function (obj, done) {
  Post.forge({ slug: obj.params.slug }).fetch({ post_status_type_id: 3, withRelated: ['comments', 'tags'] }).exec(function (err, post) {
    if (err) { return done(err); }

    if (!post) { return done(new HTTPError.NotFoundError()); }

    obj.context = {
      post: post.toJSON(),
      page: { title: post.get('title') }
    };
    done(null, obj);
  });
};

BlogController.prototype.newCommentPost = function (obj, done) {
  var template = this._template(obj, 'default');
  var comment;

  if (!obj.hasPermission()) { return done(new HTTPError.NotAuthorizedError()); }

  if (obj.data.csrf_token !== obj.session.uid()) { return done(new HTTPError.BadRequestError()); }

  if (Object.keys(obj.data).length === 0) {
    obj.formErrors = { general: 'No data submitted' };
    this.view(obj, done);
    return;
  }

  obj.data.by = obj.current_user.user_id;
  obj.data.comment_type_id = 1;
  var comment = Comment.forge({
    content: S(obj.data.content).stripTags().s,
    comment_type_id: 1,
    by: obj.current_user.user_id
  });
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
          }.bind(this));
        }
      }.bind(this));
    }
  }.bind(this));
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

BlogController.prototype._comment = function () {
  return Comment(this._commentStore);
}

function newBlogController(opts, commentStore, stompClient) {
  var controller = new BlogController(opts);
  controller.setCommentStore(commentStore);
  controller.setStompClient(stompClient);
  return controller;
}

module.exports = newBlogController;
