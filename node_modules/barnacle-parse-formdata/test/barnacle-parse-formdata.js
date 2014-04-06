var test = require('tape');
var ParseFormData = require('..');
var Stream = require('stream');
var PassThrough = Stream.PassThrough;

test('Instantiate', function (t) {
  t.plan(2);
  t.ok((new ParseFormData()) instanceof Stream);
  t.ok((new ParseFormData()) instanceof ParseFormData);
});

test('Emits object with res object as key', function (t) {
  t.plan(1);

  var pfd = new ParseFormData();
  var pt = new PassThrough();

  pt.url = 'http://example.com';
  pfd.on('data', function (obj) {
    t.equal(obj.req.url, 'http://example.com');
  });
  pt.pipe(pfd);
  pt.end('');
});

test('Emits object with data from GET', function (t) {
  t.plan(1);

  var pfd = new ParseFormData();
  var pt = new PassThrough();

  pt.url = 'http://example.com?what=does&the=fox&say=ding';
  pfd.on('data', function (obj) {
    t.equal(obj.data.what, 'does');
  });
  pt.pipe(pfd);
  pt.end('');
});

test('Emits object with data from POST', function (t) {
  t.plan(1);

  var pfd = new ParseFormData();
  var pt = new PassThrough();

  pt.url = 'http://example.com';
  pt.headers = {
    'content-type': 'application/x-www-form-urlencoded'
  };
  pfd.on('data', function (obj) {
    t.equal(obj.data.where, 'here');
  });
  pt.pipe(pfd);
  pt.end('where=here');
});

test('Emits object with data from JSON', function (t) {
  t.plan(1);

  var pfd = new ParseFormData();
  var pt = new PassThrough();

  pt.url = 'http://example.com';
  pt.headers = {
    'content-type': 'application/json'
  };
  pfd.on('data', function (obj) {
    t.equal(obj.data.how, 'easily');
  });
  pt.pipe(pfd);
  pt.end(JSON.stringify({ how: 'easily' }));
});

test('Emits error when error parsing JSON', function (t) {
  t.plan(1);

  var pfd = new ParseFormData();
  var pt = new PassThrough();

  pt.url = 'http://example.com';
  pt.headers = {
    'content-type': 'application/json; charset=UTF-8'
  };
  pfd.on('error', function (err) {
    t.ok(err instanceof Error);
  });
  pt.pipe(pfd);
  pt.end('{asdgasgasgASGDASDGASG');
});

test('Emits error with HTTP status code when error parsing JSON', function (t) {
  t.plan(1);

  var pfd = new ParseFormData();
  var pt = new PassThrough();

  pt.url = 'http://example.com';
  pt.headers = {
    'content-type': 'application/json; charset=UTF-8'
  };
  pfd.on('error', function (err) {
    t.equal(err.statusCode, 400);
  });
  pt.pipe(pfd);
  pt.end('{asdgasgasgASGDASDGASG');
});
