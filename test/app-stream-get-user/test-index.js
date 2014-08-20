var test = require('tape');
var getUser = require('app/stream/get-user-stream');
var loadUserSession = require('lib/use-case/load-user-session');

function noop() {}

function testPass(t) { return function () { t.pass(); } };

function newObjMode() {
  var PassThrough = require('stream').PassThrough;
  return new PassThrough({ objectMode: true });
}

function dummyStreamData(user_id) {
  return {
    session: {
      get: function () {
        return user_id;
      }
    }
  };
}

function makeUserFinder(func) {
  return {
    findById: func
  };
}

test('No user id', function (t) {
  t.plan(2);
  var p = newObjMode();
  var g = getUser({
    loadUserSession: loadUserSession,
    userFinder: makeUserFinder(function (a, done) { done(); }),
    userBuilder: noop
  });
  p.pipe(g);
  g.on('data', function (data) {
    t.equal(data.currentUser, null);
  });
  g.on('end', testPass(t));
  p.end(dummyStreamData());
});

test('User finder error', function (t) {
  t.plan(1);
  var p = newObjMode();
  var g = getUser({
    loadUserSession: loadUserSession,
    userFinder: makeUserFinder(function (a, done) {
      done(new Error('USERFINDERERROR'));
    }),
    userBuilder: noop
  });
  p.pipe(g);
  g.on('error', function (err) {
    t.equal(err.message, 'USERFINDERERROR');
  });
  p.end(dummyStreamData(1));
});

test('Finds user', function (t) {
  t.plan(2);
  var p = newObjMode();
  var g = getUser({
    loadUserSession: loadUserSession,
    userFinder: makeUserFinder(function (a, done) {
      done(null, {
        user_id: 1,
        name: 'Detective Potato'
      })
    }),
    userBuilder: function (data) { return data; }
  });
  p.pipe(g);
  g.on('data', function (data) {
    t.equal(data.currentUser.name, 'Detective Potato');
  });
  g.on('end', testPass(t));
  p.end(dummyStreamData(1));
});
