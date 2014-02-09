var test = require('tape');
var VS = require('..');
var PassThrough = require('stream').PassThrough;
var collect = function (stream, done) {
  var chunks = [];

  stream.on('data', chunks.push.bind(chunks));
  stream.on('end', function () {
    done(null, Buffer.concat(chunks).toString());
  });
};

test('Is instance of view stream', function (t) {
  t.plan(1);
  t.ok(VS() instanceof VS);
});

test('Directly pipes data', function (t) {
  t.plan(1);
  var res = new PassThrough();
  var vs = VS();

  collect(res, function (err, data) {
    t.equal('ABC123', data);
  });

  vs.pipe(res);
  vs.write('A');
  vs.write('B');
  vs.write('C');
  vs.write('1');
  vs.write('2');
  vs.end('3');
});

test('Outputs 500 error', function (t) {
  t.plan(1);
  var res = new PassThrough();
  var vs = VS();

  collect(res, function(err, data) {
    t.equal('500 Internal Server Error', data);
  });
  vs.pipe(res);
  vs.emit('error', new Error('Some random error'));
});

test('No error output if already streamed data', function (t) {
  t.plan(1);
  var res = new PassThrough();
  var vs = VS();

  collect(res, function (err, data) {
    t.equal('AB', data);
  });
  vs.pipe(res);
  vs.write('A');
  vs.write('B');
  vs.emit('error', new Error('Some random error'));
  vs.end('C');
});

test('Output error from statusCode', function (t) {
  t.plan(1);
  var res = new PassThrough();
  var vs = VS();
  var e = new Error('Some random error');

  e.statusCode = 404;
  collect(res, function(err, data) {
    t.equal('404 Not Found', data);
  });
  vs.pipe(res);
  vs.emit('error', e);
});

test('Custom 500 error handler', function (t) {
  t.plan(1);
  var res = new PassThrough();
  var vs = VS({
    errors: {
      500: function () {
        return 'You are likely to be eaten by a grue';
      }
    }
  });

  collect(res, function(err, data) {
    t.equal(data, 'You are likely to be eaten by a grue');
  });
  vs.pipe(res);
  vs.emit('error', new Error('Some random error'));
});

test('Passes error object to handler', function (t) {
  t.plan(1);
  var res = new PassThrough();
  var vs = VS({
    errors: {
      500: function (err) {
        t.equal(err.message, 'Further error information');
      }
    }
  });
  var e = new Error('Further error information');

  vs.pipe(res);
  vs.emit('error', e);
});

test('Adds 500 statusCode when error lacks a statusCode', function (t) {
  t.plan(1);
  var res = new PassThrough();
  var vs = VS({
    errors: {
      500: function (err) {
        t.equal(err.statusCode, 500);
      }
    }
  });
  var e = new Error('Further error information');

  vs.pipe(res);
  vs.emit('error', e);
});

test('Sets content type', function (t) {
  t.plan(2);
  var res = new PassThrough();
  var vs = VS({ contentType: 'text/html' });

  res.setHeader = function (name, value) {
    t.equal(name, 'Content-Type');
    t.equal(value, 'text/html');
  };
  vs.pipe(res);
});

test('Sets status code on error', function (t) {
  t.plan(1);
  var res = new PassThrough();
  var vs = VS();
  var e = new Error('Generic error');

  vs.pipe(res);
  vs.emit('error', e);
  t.equal(res.statusCode, 500);
});
