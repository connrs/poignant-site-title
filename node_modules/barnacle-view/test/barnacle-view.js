var test = require('tape');
var BarnacleView = require('..');
var PassThrough = require('stream').PassThrough;

function resMock() {
  var res = new PassThrough();
  res.setHeader = function () {};
  return res;
}

test('Sets content type header on res', function (t) {
  t.plan(2);

  var bv = new BarnacleView();
  var res = resMock();
  res.setHeader = function (name, value) {
    t.equal(name, 'content-type');
    t.equal(value, 'text/html');
  };
  bv.pipe(res);
  bv.end({
    headers: {
      'content-type': 'text/html'
    }
  });
});

test('Sets 2 headers on res', function (t) {
  t.plan(4);

  var bv = new BarnacleView();
  var res = resMock();
  var count = 0;
  res.setHeader = function (name, value) {
    if (count === 0) {
      t.equal(name, 'content-type');
      t.equal(value, 'text/html');
    }
    else if (count === 1) {
      t.equal(name, 'x-random-header');
      t.equal(value, 'foo_bar');
    }

    count++;
  };
  bv.pipe(res);
  bv.end({
    headers: {
      'content-type': 'text/html',
      'x-random-header': 'foo_bar'
    }
  });
});

test('Pushes output to res', function (t) {
  t.plan(1);

  var bv = new BarnacleView();
  var res = resMock();
  res.on('data', function (data) {
    t.equal(data.toString(), 'OUTPUTFOOBAR');
  });
  bv.pipe(res);
  bv.end({
    output: 'OUTPUTFOOBAR'
  });
});

test('Sets 500 status code on error', function (t) {
  t.plan(2);

  var src = new PassThrough();
  var bv = new BarnacleView();
  var res = resMock();
  res.on('finish', function () {
    t.equal(res.statusCode, 500);
  });
  res.on('unpipe', function () {
    t.pass();
  });
  src.pipe(bv).pipe(res);
  src.emit('error', new Error('generic error'));
});

test('Sets 400 status code on error with 400 status code', function (t) {
  t.plan(2);

  var src = new PassThrough();
  var bv = new BarnacleView();
  var res = resMock();
  var err = new Error('Some sort of 400 error');
  err.statusCode = 400;
  res.on('finish', function () {
    t.equal(res.statusCode, 400);
  });
  res.on('unpipe', function () {
    t.pass();
  });
  src.pipe(bv).pipe(res);
  src.emit('error', err);
});

test('Sets text/html as the content type on error', function (t) {
  t.plan(1);

  var src = new PassThrough();
  var bv = new BarnacleView();
  var res = resMock();
  var err = new Error('Some sort of 400 error');
  res.setHeader = function (name, value) {
    if (name === 'content-type') {
      t.equal(value, 'text/html; charset=UTF-8');
    }
  };
  src.pipe(bv).pipe(res);
  src.emit('error', err);
});

test('Sets application/json as the content type on error', function (t) {
  t.plan(1);

  var src = new PassThrough();
  var bv = new BarnacleView();
  var res = resMock();
  var err = new Error('Some sort of 500 error');
  err.headers = {
    'content-type': 'application/json'
  };
  res.setHeader = function (name, value) {
    if (name === 'content-type') {
      t.equal(value, 'application/json');
    }
  };
  src.pipe(bv).pipe(res);
  src.emit('error', err);
});

test('Formats errors with custom template', function (t) {
  t.plan(1);

  var src = PassThrough();
  var bv = new BarnacleView();
  var res = resMock();
  var testHandler = function (error, statusCode) {
    return statusCode + ' ' + error.message;
  };
  var err = new Error('Internal Server Error');

  bv.setErrorHandler(testHandler);
  res.on('data', function (data) {
    t.equal(data.toString(), '500 Internal Server Error');
  });
  src.pipe(bv).pipe(res);
  src.emit('error', err);
});
