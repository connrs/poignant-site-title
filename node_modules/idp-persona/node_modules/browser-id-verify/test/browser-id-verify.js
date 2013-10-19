var test = require('tape');
var requestMock = function () { this.init(); };
var verify;
var options;
var assertion = 'someassertion';
var audience = 'http://example.org:3000';
var url = 'https://verifier.login.persona.org/verify';
var noop = function () {};

require.cache[require.resolve('request')] = { exports: requestMock };
verify = require('..');

test('Throw error if no assertion', function (t) {
  options = {};
  t.plan(1);
  t.throws(verify.bind(verify, options), /No assertion provided/);
});

test('Throw error if no audience', function (t) {
  options = {
    assertion: assertion
  };
  t.plan(1);
  t.throws(verify.bind(verify, options), /No audience provided/);
});

test('Throw error if no URL', function (t) {
  options = {
    assertion: assertion,
    audience: audience
  };
  t.plan(1);
  t.throws(verify.bind(verify, options), /No URL provided/);
});

test('Throw error if no callback', function (t) {
  options = {
    assertion: assertion,
    audience: audience,
    url: url
  };
  t.plan(1);
  t.throws(verify.bind(verify, options), /No callback provided/);
});

test('Creates request object with verification URL', function (t) {
  options = {
    assertion: assertion,
    audience: audience,
    url: url
  };
  t.plan(1);
  requestMock.post = function (url, data, func) {
    t.equal('https://verifier.login.persona.org/verify', url);
  };
  verify(options, noop);
});

test('Creates request object with form data', function (t) {
  options = {
    assertion: assertion,
    audience: audience,
    url: url
  };
  t.plan(1);
  requestMock.post = function (url, data, func) {
    t.deepEqual({
      form: {
        assertion: assertion,
        audience: audience
      }
    }, data);
  };
  verify(options, noop);
});

test('Callback with error when request error', function (t) {
  t.plan(1);
  options = {
    assertion: assertion,
    audience: audience,
    url: url
  };
  requestMock.post = function (url, data, func) {
    func(new Error('Generic request error'));
  };
  verify(options, function (err, response) {
    t.equal(err.message, 'Generic request error');
  });
});

test('Callback with error when status code not 200', function (t) {
  t.plan(1);
  options = {
    assertion: assertion,
    audience: audience,
    url: url
  };
  requestMock.post = function (url, data, func) {
    func(null, { statusCode: 404 });
  };
  verify(options, function (err, response) {
    t.equal(err.message, 'HTTP response error');
  });
});

test('Callback with error when JSON parsing fails', function (t) {
  t.plan(1);
  options = {
    assertion: assertion,
    audience: audience,
    url: url
  };
  requestMock.post = function (url, data, func) {
    func(null, { statusCode: 200 }, 'invalidjson');
  };
  verify(options, function (err, response) {
    t.ok(err instanceof Error);
  });
});

test('Callback with error when JSON status failure', function (t) {
  t.plan(1);
  options = {
    assertion: assertion,
    audience: audience,
    url: url
  };
  requestMock.post = function (url, data, func) {
    func(null, { statusCode: 200 }, JSON.stringify({
      status: 'failure',
      reason: 'Invalid assertion reason'
    }));
  };
  verify(options, function (err, response) {
    t.equal(err.message, 'Invalid assertion reason');
  });
});

test('Callback with JSON response', function (t) {
  t.plan(1);
  options = {
    assertion: assertion,
    audience: audience,
    url: url
  };
  requestMock.post = function (url, data, func) {
    func(null, { statusCode: 200 }, JSON.stringify({
      status: 'okay',
      email: 'success@example.org',
      audience: audience,
      expires: Date.now(),
      issuer: 'verifier.login.persona.org'
    }));
  };
  verify(options, function (err, response) {
    if (err) {
      t.fail();
      return;
    }

    t.equal('success@example.org', response.email);
  });
});

test('Callback with error when non-standard JSON', function (t) {
  t.plan(1);
  options = {
    assertion: assertion,
    audience: audience,
    url: url
  };
  requestMock.post = function (url, data, func) {
    func(null, { statusCode: 200 }, JSON.stringify({
      status: 'unknown'
    }));
  };
  verify(options, function (err, response) {
    t.equal(err.message, 'Non-standard JSON response');
  });
});
