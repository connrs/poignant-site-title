var test = require('tape');
var PgStoreMock = function () {
  PgStoreMock.init.apply(null, Array.prototype.slice.call(arguments));
};
var SessionsMock = function () {
  this.init.apply(this, Array.prototype.slice.call(arguments));
};
var conString = 'postgres://postgres:postgres@postgres/postgres';

require.cache[require.resolve('sessions-pg-store')] = { exports: PgStoreMock  };
require.cache[require.resolve('sessions')] = { exports: SessionsMock  };
var pgSession = require('..');

test('Sets store and store options to sessions', function (t) {
  var req = {};
  var res = {};
  var session;
  var addSession;
  t.plan(2);
  SessionsMock.prototype.init = function (Store, options, storeOptions) {
    t.equal(Store, PgStoreMock);
    t.deepEqual(storeOptions, {
      pg: {},
      conString: conString,
      table: 'sess'
    });
  };
  SessionsMock.prototype.httpRequest = function () {};
  session = pgSession({ pg: {}, conString: conString, table: 'sess' });
});

test('Stream adds object to request', function (t) {
  var sess = {
    test_a: 1,
    test_b: 9
  };
  var session;
  var addSession;
  t.plan(1);
  SessionsMock.prototype.init = function (Store, options, storeOptions) {};
  SessionsMock.prototype.httpRequest = function (req, res, done) { done(null, sess); };
  session = pgSession({ pg: {}, conString: conString, table: 'sess' });
  addSession = session({}, {});
  addSession.on('data', function (obj) {
    t.deepEqual(obj.session, sess);
  });
  addSession.end({});
});

test('Stream emits error on session error', function (t) {
  var sess = {
    test_a: 1,
    test_b: 9
  };
  var session;
  var addSession;
  t.plan(1);
  SessionsMock.prototype.init = function (Store, options, storeOptions) {};
  SessionsMock.prototype.httpRequest = function (req, res, done) { done(new Error('SESSION PGSQL ERROR')); };
  session = pgSession({ pg: {}, conString: conString, table: 'sess' });
  addSession = session({}, {});
  addSession.on('error', function (err) {
    t.equal(err.message, 'SESSION PGSQL ERROR');
  });
  addSession.end({});
});

test('Options argument is optional', function (t) {
  pgSession();
  t.end();
});

test('Session options set expires to null', function (t) {
  t.plan(1);
  SessionsMock.prototype.init = function (Store, options, storeOptions) {
    t.deepEqual(options, {
      expires: null
    });
  };
  pgSession();
});
