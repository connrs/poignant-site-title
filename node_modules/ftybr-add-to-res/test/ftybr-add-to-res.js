var test = require('tape');
var addToRes = require('..');

test('Add variable to response object', function (t) {
  t.plan(2);
  var req = {};
  var res = {};
  var add = addToRes('test', { pass: true });
  add(req, res, function (err) {
    t.error(err);
    t.deepEqual(res.test, { pass: true });
  });
});
