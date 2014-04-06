var test = require('tape');
var Router = require('..');
var PassThrough = require('stream').PassThrough;
var req, res, r;

function initRouter() {
  r = new Router();
}

function resetReqRes() {
  req = new PassThrough();
  res = new PassThrough();
}

test('No routes emits 500 status code', function (t) {
  t.plan(1);
  initRouter();
  resetReqRes();

  var request = r.request();
  request.on('error', function (err) {
    t.equal(err.statusCode, 500);
  });
  request.end({
    req: {},
    res: {}
  });
});

test('No routes returns error text', function (t) {
  t.plan(1);
  initRouter();
  resetReqRes();

  var request = r.request();
  request.on('error', function (err) {
    t.equal(err.message, 'Internal Server Error');
  });
  request.end({
    req: {},
    res: {}
  });
});

test('One route unmatched 404 status code', function (t) {
  var fakeController = {
    getRoutes: function () { return [
      ['get', '/', function () {}]
    ]; }
  };
  t.plan(1);
  initRouter();
  resetReqRes();
  req.url = 'http://example.com/haha';
  r.registerController(fakeController);

  var request = r.request();
  request.on('error', function (err) {
    t.equal(err.statusCode, 404);
  });
  request.end({
    req: req,
    res: res
  });
});

test('Webroot get action', function (t) {
  var fakeController = {
    getRoutes: function () { return [
      ['get', '/', function (obj, done) {
        done(null, {
          output: 'SUCCESSINATOR'
        });
      }]
    ]; }
  };
  t.plan(1);
  initRouter();
  resetReqRes();
  req.url = '/';
  req.method = 'GET';
  r.registerController(fakeController);

  var request = r.request();
  request.on('data', function (obj) {
    t.equal(obj.output, 'SUCCESSINATOR');
  });
  request.end({
    req: req,
    res: res
  });
});

test('Webroot post action', function (t) {
  var fakeController = {
    getRoutes: function () { return [
      ['post', '/', function (obj, done) {
        done(null, {
          output: 'SUCCESSINATOR'
        });
      }]
    ]; }
  };
  t.plan(1);
  initRouter();
  resetReqRes();
  req.url = '/';
  req.method = 'POST';
  r.registerController(fakeController);

  var request = r.request();
  request.on('data', function (obj) {
    t.equal(obj.output, 'SUCCESSINATOR');
  });
  request.end({
    req: req,
    res: res
  });
});

test('Error in action is emitted by stream', function (t) {
  var fakeController = {
    getRoutes: function () { return [
      ['post', '/', function (obj, done) {
        done(new Error('Random Error Message'));
      }]
    ]; }
  };
  t.plan(1);
  initRouter();
  resetReqRes();
  req.url = '/';
  req.method = 'POST';
  r.registerController(fakeController);

  var request = r.request();
  request.on('error', function (err) {
    t.equal(err.message, 'Random Error Message');
  });
  request.end({
    req: req,
    res: res
  });
});

test('Webroot get action with params', function (t) {
  var fakeController = {
    getRoutes: function () { return [
      ['get', '/:name', function (obj, done) {
        t.equal(obj.params.name, 'NAMEPARAMISHERE');
      }]
    ]; }
  };
  t.plan(1);
  initRouter();
  resetReqRes();
  req.url = '/NAMEPARAMISHERE';
  req.method = 'GET';
  r.registerController(fakeController);

  var request = r.request();
  request.end({
    req: req,
    res: res
  });
});
