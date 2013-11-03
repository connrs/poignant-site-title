var test = require('tape');
var client = require('../lib/client.js');
var c;

test('Returns error if error connecting', function (t) {
  t.plan(1);
  connect = function (done) {
    done(new Error('PGSQL ERROR'));
  };
  client(connect, function (err) {
    t.equal(err.message, 'PGSQL ERROR');
  });
});

test('If no error returns query function', function (t) {
  t.plan(1);
  c = {
    query: function (query, params, done) {
      t.pass();
      done(null, {rows: []});
    }
  };
  connect = function (done) {
    done(null, c, function () {});
  };
  client(connect, function (err, query) {
    query('WIN', [], function () {});
  });
});

test('Returns client to pool after query', function (t) {
  t.plan(1);
  c = {
    query: function (query, params, done) {
      done(null, {rows: []});
    }
  };
  connect = function (done) {
    done(null, c, function () {
      t.pass();
    });
  };
  client(connect, function (err, query) {
    query('WIN', [], function () {});
  });
});

test('Returns client to pool after query with error', function (t) {
  t.plan(1);
  c = {
    query: function (query, params, done) {
      done(new Error('PGSQL ERROR'));
    }
  };
  connect = function (done) {
    done(null, c, function (err) {
      t.equal(err.message, 'PGSQL ERROR');
    });
  };
  client(connect, function (err, query) {
    query('WIN', [], function () {});
  });
});


