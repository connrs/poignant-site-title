var test = require('tape');
var addToReq = require('..');

test('Add variable to request object', function (t) {
  t.plan(2);
  var req = {};
  var res = {};
  var add = addToReq('test', { pass: true });
  add(req, res, function (err) {
    t.error(err);
    t.deepEqual(req.test, { pass: true });
  });
});
