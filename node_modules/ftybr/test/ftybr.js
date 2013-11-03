var test = require('tape');
var router = require('..');
var PassThrough = require('stream').PassThrough;
var req, res, r;

function collectStream(stream, done) {
  var output = [];

  stream.on('data', output.push.bind(output));
  stream.on('error', done.bind(null));
  stream.on('end', function () {
    done(null, Buffer.concat(output).toString());
  });
}

function initRouter() {
  r = router();
}

function resetReqRes() {
  req = new PassThrough();
  res = new PassThrough();
  res.statusCode = 200;
}

test('Expose Constructor', function (t) {
  t.plan(1);
  t.ok(router() instanceof router.Ftybr);
});

test('No routes sets 500 status code', function (t) {
  t.plan(1);
  initRouter();
  resetReqRes();
  r.requestListener()(req, res);
  t.equal(res.statusCode, 500);
});

test('No routes returns error text', function (t) {
  t.plan(1);
  initRouter();
  resetReqRes();
  collectStream(res, function (err, data) {
    t.equal(data, 'Internal Server Error');
  });
  r.requestListener()(req, res);
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
  r.requestListener()(req, res);
  t.equal(res.statusCode, 404);
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
  collectStream(res, function (err, data) {
    t.equal(data, 'Not Found');
  });
  r.registerController(fakeController);
  r.requestListener()(req, res);
});

test('Webroot get action', function (t) {
  var fakeController = {
    getRoutes: function () { return [
      ['get', '/', function (req, res) {
        res.end('SUCCESSINATOR');
      }]
    ]; }
  };
  t.plan(1);
  initRouter();
  resetReqRes();
  req.url = '/';
  req.method = 'GET';
  collectStream(res, function (err, data) {
    t.equal(data, 'SUCCESSINATOR');
  });
  r.registerController(fakeController);
  r.requestListener()(req, res);
});

test('Webroot post action', function (t) {
  var fakeController = {
    getRoutes: function () { return [
      ['get', '/', function (req, res) {
        res.end('SUCCESSINATOR');
      }]
    ]; }
  };
  t.plan(1);
  initRouter();
  resetReqRes();
  req.url = '/';
  req.method = 'GET';
  collectStream(res, function (err, data) {
    t.equal(data, 'SUCCESSINATOR');
  });
  r.registerController(fakeController);
  r.requestListener()(req, res);
});

test('Register middleware', function (t) {
  t.plan(1);
  initRouter();
  resetReqRes();
  r.registerMiddleware(function (req, res, done) {
    t.pass();
  });
  r.requestListener()(req, res);
});

test('Use middleware', function (t) {
  t.plan(1);
  initRouter();
  resetReqRes();
  r.registerMiddleware(function (req, res, done) {
    req.funkmeister = true;
  });
  r.requestListener()(req, res);
  t.equal(req.funkmeister, true);
});

test('500 Error if middleware error', function (t) {
  var fakeController = {
    getRoutes: function () { return [
      ['get', '/', function (req, res) {
        res.end('SUCCESSINATOR');
      }]
    ]; }
  };
  t.plan(1);
  initRouter();
  resetReqRes();
  r.registerMiddleware(function (req, res, done) {
    done(new Error('MIDDLEWARE ERROR'));
  });
  r.registerController(fakeController);
  r.requestListener()(req, res);
  t.equal(res.statusCode, 500);
});

test('Custom middleware error if status code set', function (t) {
  var fakeController = {
    getRoutes: function () { return [
      ['get', '/', function (req, res) {
        res.end('SUCCESSINATOR');
      }]
    ]; }
  };
  t.plan(2);
  initRouter();
  resetReqRes();
  r.registerMiddleware(function (req, res, done) {
    res.statusCode = 400;
    done(new Error('MIDDLEWARE ERROR'));
  });
  r.registerController(fakeController);
  collectStream(res, function (err, data) {
    t.equal(data, 'Bad Request');
  });
  r.requestListener()(req, res);
  t.equal(res.statusCode, 400);
});

test('Error passed to error handler', function (t) {
  var fakeController = {
    getRoutes: function () { return [
      ['get', '/', function (req, res) {
        res.end('SUCCESSINATOR');
      }]
    ]; }
  };
  var fakeErrorController = {
    getRoutes: function () { return [
      ['500', function (req, res, err) {
        t.equal(err.message, 'MIDDLEWARE ERROR');
      }]
    ]; }
  };
  t.plan(1);
  initRouter();
  resetReqRes();
  r.registerMiddleware(function (req, res, done) {
    done(new Error('MIDDLEWARE ERROR'));
  });
  r.registerController(fakeController);
  r.registerErrorController(fakeErrorController);
  r.requestListener()(req, res);
});

test('Error message passed to error handler', function (t) {
  var fakeController = {
    getRoutes: function () { return [
      ['get', '/', function (req, res) {
      console.log('here');
        res.render500(new Error('erm'), 'Helpful text');
      }]
    ]; }
  };
  var fakeErrorController = {
    getRoutes: function () { return [
      ['500', function (req, res, err, context) {
        t.equal(context.message, 'Helpful text');
      }]
    ]; }
  };
  t.plan(1);
  initRouter();
  resetReqRes();
  req.url = '/';
  req.method = 'GET';
  r.registerController(fakeController);
  r.registerErrorController(fakeErrorController);
  r.requestListener()(req, res);
});

test('Context object passed to error handler', function (t) {
  var fakeController = {
    getRoutes: function () { return [
      ['get', '/', function (req, res) {
      console.log('here');
        res.render500(new Error('erm'), { data: 1 });
      }]
    ]; }
  };
  var fakeErrorController = {
    getRoutes: function () { return [
      ['500', function (req, res, err, context) {
        t.equal(context.data, 1);
      }]
    ]; }
  };
  t.plan(1);
  initRouter();
  resetReqRes();
  req.url = '/';
  req.method = 'GET';
  r.registerController(fakeController);
  r.registerErrorController(fakeErrorController);
  r.requestListener()(req, res);
});
