var test = require('tape');
var map = require('lib/util/map');

function plusOne(a) { return a + 1; }

test('map', function (t) {
  t.plan(1);
  t.deepEqual([2, 3, 4], map(plusOne, [1, 2, 3]));
});
