var test = require('tape');
var PassThrough = require('stream').PassThrough;
var rap = require('..');

test('One stream', function (t) {
  var r = rap();
  var p = new PassThrough();

  t.plan(1);
  r.on('data', function (arr) {
    t.equal(arr[0].toString(), 'ONLYONESTREAM');
  });
  r.write([p]);
  r.end();
  p.write('ONLY');
  p.write('ONE');
  p.end('STREAM');
});

test('Two streams', function (t) {
  var r = rap();
  var result = [];
  var p1 = new PassThrough();
  var p2 = new PassThrough();

  t.plan(2);
  r.on('data', function (arr) {
    result.push(arr);
  });
  r.on('end', function () {
    t.equal(result[0][0].toString(), 'STREAMONE');
    t.equal(result[1][0].toString(), 'STREAMTWO');
  });
  r.write([p1]);
  r.write([p2]);
  r.end();
  p1.write('STREAMONE');
  p2.write('STREAMTWO');
  p1.end();
  p2.end();
});

test('One stream as 2nd index', function (t) {
  var r = rap({index: 1});
  var p = new PassThrough();

  t.plan(2);
  r.on('data', function (arr) {
    t.equal(arr[0], 'one');
    t.equal(arr[1].toString(), 'ONLYONESTREAM');
  });
  r.write(['one', p]);
  r.end();
  p.write('ONLY');
  p.write('ONE');
  p.end('STREAM');
});

test('Two streams as 2nd index', function (t) {
  var r = rap({index: 1});
  var result = [];
  var p1 = new PassThrough();
  var p2 = new PassThrough();

  t.plan(4);
  r.on('data', function (arr) {
    result.push(arr);
  });
  r.on('end', function () {
    t.equal(result[0][0], 'one');
    t.equal(result[1][0], 'two');
    t.equal(result[0][1].toString(), 'STREAMONE');
    t.equal(result[1][1].toString(), 'STREAMTWO');
  });
  r.write(['one', p1]);
  r.write(['two', p2]);
  r.end();
  p1.write('STREAMONE');
  p2.write('STREAMTWO');
  p1.end();
  p2.end();
});

test.only('Emits error when encountering readable error', function (t) {
  var r = rap();
  var p = new PassThrough();

  t.plan(1);
  r.on('error', function (err) {
    t.equal(err.message, 'Readable Stream Error');
  });
  r.write([p]);
  r.end();
  p.emit('error', new Error('Readable Stream Error'));
});
