var test = require('tape');
var on = require('lib/util/on');

function noop() {}

test('on', function (t) {
  t.plan(2);
  on('eventType', noop, {
    on: function (type, func) {
      t.equal('eventType', type);
      t.ok(typeof func === 'function');
    }
  });
})
