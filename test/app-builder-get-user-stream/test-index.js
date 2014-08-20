var test = require('tape');
var getUserStreamBuilder = require('app/builder/get-user-stream');

test('No user', function (t) {
  t.plan(1);
  var o = {
    session: {
      get: function () {
        return null;
      }
    }
  };
  var buildGetUserStream = getUserStreamBuilder();
  var getUserStream = buildGetUserStream();
  getUserStream.on('data', function (data) {
    t.equal(data.currentUser, null);
    t.end();
  });
  getUserStream.end(o);
});

test('There is a user', function (t) {
  t.plan(1);
  var o = {
    session: {
      get: function () {
        return 1;
      }
    }
  };
  var buildGetUserStream = getUserStreamBuilder();
  var getUserStream = buildGetUserStream();
  getUserStream.on('data', function (data) {
    t.deepEqual(data.currentUser.toJSON(), {
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
    });
    t.end();
  });
  getUserStream.end(o);
});
