var test = require('tape');
var userFinder = require('dao/finder/user');
var UserStore = require('dao/store/user');

test('Authenticate non-user', function (t) {
  t.plan(1);
  var finder = userFinder({
    userStore: new UserStore()
  });
  var expected = null;
  finder.authenticate(null, null, function (err, user) {
    t.equal(user, expected);
  });
})

test('Authenticate valid details', function (t) {
  t.plan(1);
  var finder = userFinder({
    userStore: new UserStore()
  })
  var expected = {
    user_id: '1',
    identity_id: '1',
    provider_id: '1',
    provider_name: 'Google',
    identity_uid: 'ABCDEFG',
    name: 'Super',
    email: 'su@example.com',
    url: 'http://example.com',
    role_id: '1',
    role_description: 'Super administrator',
    role_name: 'su',
    deleted_at: null,
    deleted_by: null,
    inserted_by: '1',
    inserted_at: new Date(1371481058769),
    updated_by: null,
    updated_at: null
  };
  finder.authenticate('ABCDEFG', 1, function (err, user) {
    console.log(err);
    t.deepEqual(user, expected);
  });
});

test('Retrieve using user_id', function (t) {
  t.plan(1);
  var finder = userFinder({
    userStore: new UserStore()
  })
  var expected = {
    user_id: '1',
    identity_id: '1',
    provider_id: '1',
    provider_name: 'Google',
    identity_uid: 'ABCDEFG',
    name: 'Super',
    email: 'su@example.com',
    url: 'http://example.com',
    role_id: '1',
    role_description: 'Super administrator',
    role_name: 'su',
    deleted_at: null,
    deleted_by: null,
    inserted_by: '1',
    inserted_at: new Date(1371481058769),
    updated_by: null,
    updated_at: null
  };
  finder.findById(1, function (err, user) {
    t.deepEqual(user, expected);
  });
});
