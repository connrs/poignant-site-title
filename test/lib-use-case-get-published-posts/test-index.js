var test = require('tape');
var getPublishedPosts = require('lib/use-case/get-published-posts');

test('PostFinder error', function (t) {
  t.plan(1);

  var opts = {
    postFinder: {
      published: function (opts, done) {
        done(new Error('POSTFINDER ERROR'));
      }
    }
  }
  getPublishedPosts(opts, function (err) {
    t.equal(err.message, 'POSTFINDER ERROR');
  });
});
