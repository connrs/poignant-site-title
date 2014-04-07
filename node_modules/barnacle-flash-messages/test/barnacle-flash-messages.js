var test = require('tape');
var flashMessages = require('..');

test('Throws if no type array is passed', function (t) {
  t.plan(1);
  t.throws(flashMessages);
});

test('Adds data to obj', function (t) {
  t.plan(1);

  var types = ['flash_message'];
  var obj = {
    session: {
      get: function () {
        return 'TESTDATA';
      },
      set: function (key, value, done) {
        done();
      }
    }
  };
  var flash = flashMessages(types)();

  flash.on('data', function (obj) {
    t.equal(obj.flash_message, 'TESTDATA');
  });
  flash.end(obj);
});

test('Clears flash messages', function (t) {
  t.plan(3);

  var types = ['flash_message'];
  var obj = {
    session: {
      get: function () {
        return 'TESTDATA';
      },
      set: function (type, data, done) {
        t.equal(type, 'flash_message');
        t.equal(data, null);
        done();
      }
    }
  };
  var flash = flashMessages(types)();

  flash.on('data', function () {
    t.pass();
  });
  flash.end(obj);
});
