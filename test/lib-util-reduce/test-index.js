var test = require('tape');
var reduce = require('lib/util/reduce');
var sum = function (a, b) {
  return a + b;
}

test('Reduce one value', function (t) {
  t.plan(1);
  var list = [1];
  t.equal(1, reduce(sum, list));
});

test('Reduce two values', function (t) {
  t.plan(1);
  var list = [1, 5];
  t.equal(6, reduce(sum, list));
});

test('Reduce two values plus initial', function (t) {
  t.plan(1);
  var list = [1, 2, 3];
  t.equal(10, reduce(sum, list, 4));
});
