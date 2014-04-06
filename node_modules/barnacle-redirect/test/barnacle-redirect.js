var test = require('tape');
var redirect = require('..');

function dummyRequest() {
  return {
    connection: { encrypted: false },
    headers: {
      host: 'example.org'
    },
    url: '/'
  };
}

function secureDummyRequest() {
  return {
    connection: { encrypted: true },
    headers: {
      host: 'example.org'
    },
    url: '/'
  };
}

test('Adds redirect function to object', function (t) {
  t.plan(1);

  var r = redirect();
  r.on('data', function (obj) {
    t.equal(typeof obj.redirect, 'function');
  });
  r.end({
    req: dummyRequest()
  });
});

test('Closes the response stream when redirect is called', function (t) {
  t.plan(1);

  var res = {
    end: function () {
      t.pass();
    },
    setHeader: function () {}
  };
  var r = redirect(res);
  r.on('data', function (obj) {
    obj.redirect('http://example.org');
  });
  r.end({
    req: dummyRequest()
  });
});

test('Sets a status code of 303 by default', function (t) {
  t.plan(1);
  var res = {
    end: function () {
      t.equal(this.statusCode, 303);
    },
    setHeader: function () {}
  };
  var r = redirect(res);
  r.on('data', function (obj) {
    obj.redirect('http://example.net');
  });
  r.end({
    req: dummyRequest()
  });
});

test('Sets http://example.com/ as the redirect location', function (t) {
  t.plan(2);
  var res = {
    end: function () {},
    setHeader: function (header, content) {
      t.equal(header, 'Location');
      t.equal(content, 'http://example.com/');
    }
  };
  var r = redirect(res);
  r.on('data', function (obj) {
    obj.redirect('http://example.com/');
  });
  r.end({
    req: dummyRequest()
  });
});

test('Sets http://google.com/ as the redirect location', function (t) {
  t.plan(2);
  var res = {
    end: function () {},
    setHeader: function (header, content) {
      t.equal(header, 'Location');
      t.equal(content, 'http://google.com/');
    }
  };
  var r = redirect(res);
  r.on('data', function (obj) {
    obj.redirect('http://google.com/');
  });
  r.end({
    req: dummyRequest()
  });
});

test('Sets 301 as the status code', function (t) {
  t.plan(1);
  var res = {
    end: function () {
      t.equal(this.statusCode, 301);
    },
    setHeader: function () {}
  };
  var r = redirect(res);
  r.on('data', function (obj) {
    obj.redirect('http://example.com', 301);
  });
  r.end({
    req: dummyRequest()
  });
});

test('Sets a relative location to folder below', function (t) {
  t.plan(1);
  var res = {
    end: function () {},
    setHeader: function (header, content) {
      t.equal(content, 'http://example.org/test/');
    }
  };
  var r = redirect(res);
  r.on('data', function (obj) {
    obj.redirect('test/');
  });
  r.end({
    req: dummyRequest()
  });
});

test('Sets a location with SSL', function (t) {
  t.plan(1);
  var res = {
    end: function () {},
    setHeader: function (header, content) {
      t.equal(content, 'https://example.org/subfolder/');
    }
  };
  var r = redirect(res);
  r.on('data', function (obj) {
    obj.redirect('subfolder/');
  });
  r.end({
    req: secureDummyRequest()
  });
});
