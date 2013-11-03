var test = require('tape');
var parseFormdata = require('..');
var PassThrough = require('stream').PassThrough;
var req, res;

function initReqRes() {
  req = new PassThrough();
  res = new PassThrough();
  req.headers = {};
}

test('No form data', function (t) {
  t.plan(1);
  initReqRes();
  req.url = '/';
  parseFormdata(req, res, function () {
    t.ok(Object.prototype.toString.call(req.data) === '[object Object]');
  });
});

test('A single query string parameter', function (t) {
  t.plan(1);
  initReqRes();
  req.url = '/?param_1=12345';
  parseFormdata(req, res, function () {
    t.equal(req.data.param_1, '12345');
  });
});

test('A query string with 2 parameters', function (t) {
  t.plan(2);
  initReqRes();
  req.url = '/?param_1=12345&param_2=abc';
  parseFormdata(req, res, function () {
    t.equal(req.data.param_1, '12345');
    t.equal(req.data.param_2, 'abc');
  });
});

test('A query string with Rails/PHP like array', function (t) {
  t.plan(1);
  initReqRes();
  req.url = '/?param_1[]=foo&param_1[]=bar';
  parseFormdata(req, res, function () {
    t.deepEqual(req.data.param_1, ['foo', 'bar']);
  });
});

test('A query string with Rails/PHP like object', function (t) {
  t.plan(1);
  initReqRes();
  req.url = '/?param_1[a]=1&param_1[b]=2&param_2[a]=z';
  parseFormdata(req, res, function () {
    t.deepEqual(req.data, {
      'param_1': {
        a: '1',
        b: '2'
      },
      'param_2': {
        a: 'z'
      }
    });
  });
});

test('URL Encoded Form Data', function (t) {
  t.plan(1);
  initReqRes();
  req.url = '/';
  req.headers['content-type'] = 'application/x-www-form-urlencoded';
  parseFormdata(req, res, function () {
    t.deepEqual(req.data, {
      a: '1'
    });
  });
  req.end('a=1');
});

test('JSON Body', function (t) {
  t.plan(1);
  initReqRes();
  req.url = '/';
  req.headers['content-type'] = 'application/json';
  parseFormdata(req, res, function () {
    t.deepEqual(req.data, {
      a: 1,
      b: ['a', 'b', 'c']
    });
  });
  req.end(JSON.stringify({
    a: 1,
    b: ['a', 'b', 'c']
  }));
});

test('Returns JSON error', function (t) {
  t.plan(2);
  initReqRes();
  req.url = '/';
  req.headers['content-type'] = 'application/json';
  parseFormdata(req, res, function (err) {
    t.equal(err.message, 'Unexpected token a');
    t.equal(res.statusCode, 400);
  });
  req.end('a');
});

test('HTTP request error', function (t) {
  t.plan(2);
  initReqRes();
  req.url = '/';
  req.headers['content-type'] = 'application/json';
  parseFormdata(req, res, function (err) {
    t.equal(err.message, 'HTTP ERROR');
    t.equal(res.statusCode, 400);
  });
  req.emit('error', new Error('HTTP ERROR'));
});

test('Request body empty', function (t) {
  t.plan(2);
  initReqRes();
  req.url = '/';
  req.headers['content-type'] = 'application/json';
  parseFormdata(req, res, function (err) {
    t.equal(err.message, 'Request body empty');
    t.equal(res.statusCode, 400);
  });
  req.end('');
});
