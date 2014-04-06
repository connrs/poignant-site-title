var test = require('tape');
var addTo = require('..');

test('Adds key to output', function (t) {
  t.plan(1);

  var addKey = addTo('key', 1);
  var o = {};

  addKey.on('data', function (data) {
    t.equal(o.key, 1);
  });
  addKey.end(o);
});

test('Adds object to output', function (t) {
  t.plan(1);

  var addKey = addTo('key', { a: { b: { c: { d: 3 } } } });
  var o = {};

  addKey.on('data', function (data) {
    t.deepEqual(o.key, { a: { b: { c: { d: 3 } } } });
  });
  addKey.end(o);
});
