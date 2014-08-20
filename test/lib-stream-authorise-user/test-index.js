var test = require('tape');
var authoriseUserStream = require('lib/stream/authorise-user');

test('No user', function (t) {
  t.plan(1);
  var stream = authoriseUserStream();
  stream.on('error', function (error) {
    t.ok(error instanceof Error);
  });
  stream.end({});
})

test('User exists', function (t) {
  t.plan(1);
  var stream = authoriseUserStream();
  stream.on('data', function (data) {
    t.equal('valid', data.sample);
  })
  stream.end({
    sample: 'valid',
    currentUser: function () {}
  });
});
