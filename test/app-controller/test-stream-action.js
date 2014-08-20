var test = require('tape');
var TestableStreamActionController = require('./testable-stream-action-controller.js');
var PassThrough = require('stream').PassThrough;

test('Stores config', function (t) {
  t.plan(1);
  var config = {
    a: 'b',
    y: 'z'
  };
  var c = new TestableStreamActionController({
    config: config
  });

  t.equal('z', c.getConfig().y);
});

test('Stores navigation', function (t) {
  t.plan(1);
  var navigation = {
    y: 2
  }
  var c = new TestableStreamActionController({
    navigation: navigation
  });

  t.equal(2, c.getNavigation().y);
});

test('Generate action stream', function (t) {
  t.plan(1);
  var c = new TestableStreamActionController();
  var input = new PassThrough({ objectMode: true });
  var actionStream = c.getRoutes()[0][2]();

  actionStream.on('data', function (data) {
    t.equal('IRGOODTESTPASS', data.output);
  });
  input.pipe(actionStream);
  input.end({});
});
