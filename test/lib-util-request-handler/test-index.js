var test = require('tape');
var stubs = require('./stubs.js');
var RequestHandler = require('lib/util/request-handler');
var PassThrough = require('stream').PassThrough;
var newO2BTransform = stubs.newO2BTransform;
var newB2OTransform = stubs.newB2OTransform;
var newResponse = stubs.newResponse;
var returner = stubs.returner;

test('Pipe route with two streams', function (t) {
  var req = new PassThrough();
  var res = newResponse();
  var rh = new RequestHandler();
  var reqToObj = newB2OTransform(function (data, enc, done) {
    done(null, {
      output: data.toString()
    });
  });
  var o2o = new PassThrough({ objectMode: true });

  rh.setRequest(req);
  rh.setResponse(res);
  rh.setRoute({action: [ returner(reqToObj), returner(o2o) ]});
  rh.execute();
  res.on('data', function (data) {
    t.equal('TESTDATA', data.toString());
  });
  res.on('end', function () {
    t.end();
  });
  req.end('TESTDATA');
});

test('Builder', function (t) {
  var req = new PassThrough();
  var res = newResponse();
  var reqToObj = newB2OTransform(function (data, enc, done) {
    done(null, {
      output: data.toString()
    });
  });
  var o2o = new PassThrough({ objectMode: true });

  RequestHandler.create({
    request: req, response: res, route: {action: [ returner(reqToObj), returner(o2o) ]}
  }).execute();
  res.on('data', function (data) {
    t.equal('TESTDATA', data.toString());
  });
  res.on('end', function () {
    t.end();
  });
  req.end('TESTDATA');
});

test('Pass request, response and params to streams', function (t) {
  t.plan(3);
  var req = new PassThrough();
  var res = newResponse();
  req.a = 'hoho';
  res.b = 'now i have a machine gun';
  var testStream = function (opts) {
    t.equal('hoho', opts.request.a);
    t.equal('now i have a machine gun', opts.response.b);
    t.equal('beepboop', opts.params);
    return new PassThrough({ objectMode: true });
  };

  RequestHandler.create({
    request: req, response: res, route: {action: [ testStream ], params: 'beepboop'}
  }).execute();
  req.end('TESTDATA');
});

test('Set text/html content type header in response', function (t) {
  t.plan(2);
  var req = new PassThrough();
  var res = newResponse();
  var reqToObj = newB2OTransform(function (data, enc, done) {
    done(null, {
      output: data.toString()
    });
  });
  var o2o = new PassThrough({ objectMode: true });

  res.setHeader = function (name, value) {
    t.equal(name, 'content-type');
    t.equal(value, 'text/html; charset=UTF-8');
  };

  RequestHandler.create({
    request: req, response: res, route: {action: [ returner(reqToObj), returner(o2o) ]}
  }).execute();
  res.on('end', function () {
    t.end();
  });
  req.end('TESTDATA');
});

test('Set custom HTTP headers in response', function (t) {
  t.plan(4);
  var req = new PassThrough();
  var res = newResponse();
  var reqToObj = newB2OTransform(function (data, enc, done) {
    done(null, {
      output: data.toString(),
      headers: {
        'content-type': 'application/xml',
        'x-random-header': 'foo-bar'
      }
    });
  });
  var o2o = new PassThrough({ objectMode: true });
  var count = 0;

  res.setHeader = function (name, value) {
    if (count === 0) {
      t.equal(name, 'content-type');
      t.equal(value, 'application/xml');
    }
    else if (count === 1) {
      t.equal(name, 'x-random-header');
      t.equal(value, 'foo-bar');
    }

    count++;
  };

  RequestHandler.create({
    request: req, response: res, route: {action: [ returner(reqToObj), returner(o2o) ]}
  }).execute();
  res.on('end', function () {
    t.end();
  });
  req.end('TESTDATA');
});

test('Default 200 status code', function (t) {
  t.plan(1);
  var req = new PassThrough();
  var res = newResponse();
  var reqToObj = newB2OTransform(function (data, enc, done) {
    done(null, {
      output: data.toString()
    });
  });
  var o2o = new PassThrough({ objectMode: true });

  RequestHandler.create({
    request: req, response: res, route: {action: [ returner(reqToObj), returner(o2o) ]}
  }).execute();
  res.on('data', function () {
    t.equal(200, res.statusCode);
  });
  res.on('end', function () {
    t.end();
  });
  req.end('TESTDATA');
});

test('Set custom statusCode in response', function (t) {
  t.plan(1);
  var req = new PassThrough();
  var res = newResponse();
  var reqToObj = newB2OTransform(function (data, enc, done) {
    done(null, {
      output: data.toString(),
      statusCode: 301,
      headers: {
        'content-type': 'application/xml',
        'x-random-header': 'foo-bar'
      }
    });
  });
  var o2o = new PassThrough({ objectMode: true });

  RequestHandler.create({
    request: req, response: res, route: {action: [ returner(reqToObj), returner(o2o) ]}
  }).execute();
  res.on('data', function () {
    t.equal(301, res.statusCode);
  });
  res.on('end', function () {
    t.end();
  });
  req.end('TESTDATA');
});

test('Error in route stream triggers error handler', function (t) {
  var req = new PassThrough();
  var res = newResponse();
  var handler = function (error) {
    return 'THIS IS AN ERROR';
  };
  var trans = newB2OTransform(function (obj, enc, done) {
    done(new Error('THIS IS AN ERROR'));
  });
  var route = {action: [
    returner(trans)
  ]};
  var rh = new RequestHandler();
  var err = new Error();

  RequestHandler.create({
    request: req, response: res, errorHandler: handler, route: route
  }).execute();
  res.on('data', function (data) {
    t.equal('THIS IS AN ERROR', data.toString());
  });
  res.on('end', function() {
    t.end();
  });
  trans.emit('error', err);
});
