var test = require('tape');
var BaseController = require('app/controller/base');

test('Returns routes', function (t) {
  t.plan(1);

  var controller = new BaseController();
  controller.setRoutes('ABC');
  t.equal('ABC', controller.getRoutes());
});
