var test = require('tape');
var barnacleMode = require('..');

test('Appends hello:world to object', function (t) {
  t.plan(1);

  var hw = barnacleMode(function (obj, done) {
    obj.hello = 'world';
    done(null, obj);
  })();

  hw.on('data', function (obj) {
    t.deepEqual(obj, { hello: 'world' });
  });
  hw.write({});
});

test('Emits error', function (t) {
  t.plan(1);

  var errzor = barnacleMode(function (obj, done) {
    done(new Error('random error'));
  })();

  errzor.on('error', function (err) {
    t.equal(err.message, 'random error');
  });
  errzor.write({});
});

test('Outputs as buffer', function (t) {
  t.plan(2);

  function toBuffer(obj, done) {
    done(null, JSON.stringify(obj));
  }

  var buffzor = barnacleMode(toBuffer, { toBuffer: true })();

  buffzor.on('data', function (data) {
    t.ok(data instanceof Buffer);
    t.equal(data.toString(), '{"oh":"yeah"}');
  });
  buffzor.write({ oh: 'yeah' });
});
