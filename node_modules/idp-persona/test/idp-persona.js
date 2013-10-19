var test = require('tape');
var verifyMock = function () { verifyMock.init.apply(verifyMock, arguments); };
var idpPersona;
var idp;

require.cache[require.resolve('browser-id-verify')] = {exports: verifyMock};
idpPersona = require('..');

test('Throws error if no audience set', function (t) {
  t.plan(1);
  t.throws(idpPersona, /IDPPersona no audience set/);
});

test('Pass url to browserIDVerify', function (t) {
  t.plan(1);
  verifyMock.init = function (opts, callback) {
    t.equal('https://verifier.login.persona.org/verify', opts.url);
  };
  idp = idpPersona({ audience: 'http://localhost' });
  idp.identity('sometoken');
});

test('Pass audience to browserIDVerify', function (t) {
  t.plan(1);
  verifyMock.init = function (opts, callback) {
    t.equal('http://localhost', opts.audience);
  };
  idp = idpPersona({ audience: 'http://localhost' });
  idp.identity('sometoken');
});

test('Pass assertion to browserIDVerify', function (t) {
  t.plan(1);
  verifyMock.init = function (opts, callback) {
    t.equal('sometoken', opts.assertion);
  };
  idp = idpPersona({ audience: 'http://localhost' });
  idp.identity('sometoken');
});

test('Returns error if browserIDVerify error', function (t) {
  t.plan(1);
  verifyMock.init = function (opts, callback) {
    callback(new Error('Generic browserIDVerify error'));
  };
  idp = idpPersona({ audience: 'http://localhost' });
  idp.identity('sometoken', function (err, identity) {
    t.equal(err.message, 'Generic browserIDVerify error');
  });
});

test('Returns email address on successful verification', function (t) {
  t.plan(1);
  verifyMock.init = function (opts, callback) {
    callback(null, { email: 'test@example.org' });
  };
  idp = idpPersona({ audience: 'http://localhost' });
  idp.identity('sometoken', function (err, identity) {
    t.equal(identity.email, 'test@example.org');
  });
});

test('Returns id on successful verification', function (t) {
  t.plan(1);
  verifyMock.init = function (opts, callback) {
    callback(null, { email: 'test@example.org' });
  };
  idp = idpPersona({ audience: 'http://localhost' });
  idp.identity('sometoken', function (err, identity) {
    t.equal(identity.id, 'test@example.org');
  });
});
