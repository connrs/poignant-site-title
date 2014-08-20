var test = require('tape');
var forEach = require('lib/util/for-each');

test('forEach', function (t) {
  t.plan(4);
  forEach(function () {
    t.pass();
  }, [1, 2, 3, 4]);
});
