var test = require('tape');
var eachKeys = require('lib/util/each-keys');

test('eachKeys', function (t) {
  t.plan(4);
  var counter = 0;
  eachKeys(function (key, val) {
    if (!counter++) {
      t.equal('potato', key);
      t.equal(1, val);
    }
    else {
      t.equal('tomato', key);
      t.equal(2, val);
    }
  }, {
    potato: 1,
    tomato: 2
  });
});
