var test = require('tape');
var authoriseUserByRoleStream = require('lib/stream/authorise-user-by-role');

test('No user', function (t) {
  t.plan(1);
  var stream = authoriseUserByRoleStream();
  stream.on('error', function (error) {
    t.ok(error instanceof Error);
  });
  stream.end({});
})

test('User does not have particular role', function (t) {
  t.plan(1);
  var stream = authoriseUserByRoleStream('su');
  stream.on('error', function (error) {
    t.ok(error instanceof Error);
  });
  stream.end({
    currentUser: {
      toJSON: function () {
        return {};
      }
    }
  });
});

test('User exists', function (t) {
  t.plan(1);
  var stream = authoriseUserByRoleStream(['su']);
  stream.on('data', function (data) {
    t.equal('valid', data.sample);
  })
  stream.end({
    sample: 'valid',
    currentUser: {
      toJSON: function () {
        return {
          role_name: 'su'
        };
      }
    }
  });
});
