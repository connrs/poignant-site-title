var test = require('tape');
var PgStoreMock = function () { PgStoreMock.init.apply(null, Array.prototype.slice.call(arguments)); };
var SessionsMock = function () { this.init.apply(this, Array.prototype.slice.call(arguments)); };
var pgSession;
var conString = 'postgres://postgres:postgres@postgres/postgres';

require.cache[require.resolve('sessions-pg-store')] = { exports: PgStoreMock };
require.cache[require.resolve('sessions')] = { exports: SessionsMock };
pgSession = require('..');

test('Sets store and store options to sessions', function (t) {
  var req = {}, res = {};
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
  pgSession({ pg: {}, conString: conString, table: 'sess' })(req, res, function () {});
});

test('Middleware sets session to request', function (t) {
  var req = {
    dbClient: {}
  };
  var res = {};
  var sess = {
    test_a: 1,
    test_b: 9
  };

  t.plan(2);
  SessionsMock.prototype.init = function() {};
  SessionsMock.prototype.httpRequest = function (req, res, done) {
    done(null, sess);
  };
  pgSession({})(req, res, function (err) {
    t.error(err);
    t.deepEqual(req.session, sess);
  });
});

test('Middleware returns error', function (t) {
  var req = {
    dbClient: {}
  };
  var res = {};

  t.plan(1);
  SessionsMock.prototype.init = function() {};
  SessionsMock.prototype.httpRequest = function (req, res, done) {
    done(new Error('SESSION PGSQL ERROR'));
  };
  pgSession({})(req, res, function (err) {
    t.equal(err.message, 'SESSION PGSQL ERROR');
  });
});

test('Options argument is optional', function (t) {
  pgSession();
  t.end();
});

test('Session options sets expires to null', function (t) {
  t.plan(1);
  SessionsMock.prototype.init = function (Store, options, storeOptions) {
    t.deepEqual(options, {
      expires: null
    });
  };
  pgSession({ pg: {}, conString: conString, table: 'sess' });
});
