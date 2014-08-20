var test = require('tape');
var User = require('lib/entity/user');

test('Empty user toJSON', function (t) {
  t.plan(1);
  var user = new User();
  t.deepEqual(user.toJSON(), {});
});

test('Non-empty user toJSON', function (t) {
  t.plan(1);
  var user = new User({
    user_id: 1,
    name: 'Joe Bloggs'
  });
  t.deepEqual(user.toJSON(), {
    user_id: 1,
    name: 'Joe Bloggs'
  });
});
