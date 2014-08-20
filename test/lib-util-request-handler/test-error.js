var test = require('tape');
var stubs = require('./stubs.js');
var ErrorRequestHandler = require('lib/util/request-handler').ErrorRequestHandler;
var PassThrough = require('stream').PassThrough;
var newO2BTransform = stubs.newO2BTransform;
var newB2OTransform = stubs.newB2OTransform;
var newResponse = stubs.newResponse;

test('Explicitly run error handler', function (t) {
  t.plan(1);
  var req = new PassThrough();
  var res = newResponse();
  var handler = function (error) {
    return 'THIS IS AN ERROR';
  };
  var err = new Error();

  res.on('data', function (data) {
    t.equal('THIS IS AN ERROR', data.toString());
  });
  res.on('end', function() {
    t.end();
  });
  ErrorRequestHandler.create({
    request: req, response: res, errorHandler: handler, route: err
  }).execute();
});

test('Error handler default 500 status code', function (t) {
  t.plan(1);
  var req = new PassThrough();
  var res = newResponse();
  var handler = function (error) {
    return 'THIS IS AN ERROR';
  };
  var err = new Error();

  ErrorRequestHandler.create({
    request: req, response: res, errorHandler: handler, route: err
  }).execute()
  res.on('data', function (data) {
    t.equal(500, res.statusCode);
  });
  res.on('end', function() {
    t.end();
  });
});

test('Error handler sends custom status code', function (t) {
  t.plan(1);
  var req = new PassThrough();
  var res = newResponse();
  var handler = function (error) {
    return 'THIS IS AN ERROR';
  };
  var err = new Error();

  err.statusCode = 400;
  ErrorRequestHandler.create({
    request: req, response: res, errorHandler: handler, route: err
  }).execute();
  res.on('data', function (data) {
    t.equal(400, res.statusCode);
  });
  res.on('end', function() {
    t.end();
  });
});

test('Error handler sends custom HTTP headers', function (t) {
  t.plan(2);
  var req = new PassThrough();
  var res = newResponse();
  var handler = function (error) {
    return 'THIS IS AN ERROR';
  };
  var err = new Error();

  res.setHeader = function (name, value) {
    t.equal(name, 'content-type');
    t.equal(value, 'application/xml');
  };
  err.headers = {
    'content-type': 'application/xml'
  };
  ErrorRequestHandler.create({
    request: req, response: res, errorHandler: handler, route: err
  }).execute();
  res.on('end', function() {
    t.end();
  });
});
