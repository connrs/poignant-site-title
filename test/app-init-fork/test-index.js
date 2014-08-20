var test = require('tape');
var fork = require('app/init/fork');
var noop = function () {};
var cluster;

test('Forks processes equal to number of processors', function (t) {
  t.plan(require('os').cpus().length);

  cluster = {
    fork: function () { t.pass(); },
    on: noop
  };

  fork(cluster);
});

test('Forks arbitrary number of processes', function (t) {
  t.plan(12);

  cluster = {
    fork: function () { t.pass(); },
    on: noop
  };

  fork(cluster, 12);
});

test('Re-forks when worker disconnects', function (t) {
  t.plan(3);

  cluster = {
    fork: function () { t.pass(); },
    on: function (type, func) {
      t.equal('disconnect', type);
      this._dc = func;
    },
    fakeDisconnect: function () {
      this._dc();
    }
  };

  fork(cluster, 1);
  cluster.fakeDisconnect();
});
