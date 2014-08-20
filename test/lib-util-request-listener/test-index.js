var test = require('tape');
var noop = function () {};
var createHandler = function () {
  return {
    execute: noop
  };
};
var RequestListener = require('lib/util/request-listener');

test('Create listener', function (t) {
  var l = new RequestListener();
  t.end();
});

test('Handler gets route', function (t) {
  t.plan(1);
  var l = new RequestListener();

  l.setRouter({
    getRoute: function(req) {
      t.equal('potato', req);
    }
  });
  l.setRequestHandler({ create: createHandler });
  l.setErrorRequestHandler(noop);
  l.setErrorHandler(noop);
  l.handler('potato');

});

test('Handler initialises errorHandler', function (t) {
  t.plan(1);
  var l = new RequestListener();

  l.setRouter({
    getRoute: noop
  });
  l.setRequestHandler({ create: function (opts) {
    opts.errorHandler();
    return { execute: noop };
  }});
  l.setErrorRequestHandler(noop);
  l.setErrorHandler(function () {
    t.pass();
  });
  l.handler('potato');
});

test('Handler executes request handler', function (t) {
  t.plan(4);
  var l = new RequestListener();

  l.setRouter({
    getRoute: function () { return 'radish'; }
  });
  l.setRequestHandler({ create: function (opts) {
    t.equal('potato', opts.request);
    t.equal('tomato', opts.response);
    t.equal('onion', opts.errorHandler());
    t.equal('radish', opts.route);
    return { execute: noop };
  }});
  l.setErrorRequestHandler(noop);
  l.setErrorHandler(function () { return 'onion'; });
  l.handler('potato', 'tomato');
});

test('Handler executes error request handler', function (t) {
  t.plan(4);
  var l = new RequestListener();

  l.setRouter({
    getRoute: function () { return new Error('radish'); }
  });
  l.setRequestHandler(noop);
  l.setErrorRequestHandler({ create: function (opts) {
    t.equal('potato', opts.request);
    t.equal('tomato', opts.response);
    t.equal('onion', opts.errorHandler());
    t.equal('radish', opts.route.message);
    return { execute: noop };
  }});
  l.setErrorHandler(function () { return 'onion'; });
  l.handler('potato', 'tomato');
});
