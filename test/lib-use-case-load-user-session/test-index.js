var test = require('tape');
var loadUserSession = require('lib/use-case/load-user-session');

function noop() {}

test('Instantiate with no options', function (t) {
  t.plan(1);
  t.throws(loadUserSession, /Invalid options/);
});

test('Instantiate with no user finder', function (t) {
  t.plan(1);

  var nouserBuilderFinderPassed = function () {
    loadUserSession({});
  };

  t.throws(nouserBuilderFinderPassed, /Invalid options/);
});

test('Instantiate with no user model', function (t) {
  t.plan(1);

  var nouserBuilderFinderPassed = function () {
    loadUserSession({ userFinder: { findById: noop } });
  };

  t.throws(nouserBuilderFinderPassed, /Invalid options/);
});

test('No user_id passed', function (t) {
  t.plan(2);

  var cb = function (err, user) {
    t.equal(err, null);
    t.equal(user, null);
  };
  var opts = {
    userId: null,
    userBuilder: function () {},
    userFinder: { findById: noop }
  }

  loadUserSession(opts, cb);
});

test('Error returned from userFinder', function (t) {
  t.plan(2);

  var cb = function (err, user) {
    t.ok(err instanceof Error);
    t.equal(err.message, 'GENERIC USER FINDER ERROR');
  };
  var opts = {
    userId: 1,
    userBuilder: function () {},
    userFinder: {
      findById: function (userId, done) {
        done(new Error('GENERIC USER FINDER ERROR'));
      }
    }
  };

  loadUserSession(opts, cb);
});

test('Instantiates a model', function (t) {
  t.plan(1);

  var cb = function (err, user) {
    t.deepEqual(user.toJSON(), {
      user_id: 1,
      name: 'Test User'
    });
  };
  var userBuilder = function (data) {
    return {
      toJSON: function () {
        return data;
      }
    };
  };
  var userFinder = {
    findById: function (userId, done) {
      done(null, {
        user_id: 1,
        name: 'Test User'
      });
    }
  };
  var opts = {
    userId: 1,
    userBuilder: userBuilder,
    userFinder: userFinder
  }

  loadUserSession(opts, cb);
});
