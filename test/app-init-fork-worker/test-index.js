var test = require('tape');
var forkWorker = require('app/init/fork-worker');
var noop = function () {};
var cluster = {
  worker: noop
};

function initCluster() {
  return { worker: {} };
}

function initLogger() {
  return noop;
}

function initApp() {
  return { requestListener: noop };
}

function initLauncher() {
  return function (func) { func(null, initApp()); };
}

function initDomain(add, on) {
  return {
    create: function () {
      return {
        add: add || noop,
        run: function (func) { func(); },
        on: on || noop
      };
    }
  };
}

test('Worker runs launch', function (t) {
  t.plan(1);
  forkWorker({
    launcher: function (func) { t.pass(); }
  });
});

test('Disconnect worker on launch error', function (t) {
  t.plan(2);

  var cluster = initCluster();
  var launcher = function (func) {
    func(new Error('ERROR'));
  };
  var logger = function (err) {
    t.equal('ERROR', err.message);
  };

  cluster.worker.disconnect = function () { t.pass(); }
  forkWorker({
    launcher: launcher,
    cluster: cluster,
    domain: initDomain(),
    logger: logger
  });
});

test('Initialises HTTP Server', function (t) {
  var add = function () { t.pass(); };
  var domain = initDomain(add);
  t.plan(3);

  forkWorker({
    launcher: initLauncher(),
    cluster: initCluster(),
    domain: domain,
    createServer: function (func) {
      t.pass();
      func();
      return { listen: noop };
    }
  });
});

test('Handles HTTP Request', function (t) {
  t.plan(3);
  forkWorker({
    launcher: function (func) {
      func(null, {
        requestListener: function (req, res) {
          t.equal('123', req);
          t.equal('ABC', res);
        }
      });
    },
    cluster: initCluster(),
    domain: initDomain(),
    createServer: function (listener) {
      listener('123', 'ABC');
      return {
        listen: function (port) {
          t.equal(8080, port);
        }
      }
    }
  });
});

test('Handles HTTP Request on custom port', function (t) {
  t.plan(1);
  forkWorker({
    launcher: initLauncher(),
    cluster: initCluster(),
    domain: initDomain(),
    serverPort: 8106,
    createServer: function (listener) {
      return {
        listen: function (port) {
          t.equal(8106, port);
        }
      }
    }
  });
});

test('Close server on domain error', function (t) {
  t.plan(7);
  var hook = {};
  var on = function (type, func) {
    t.equal('error', type, 'Domain error type');
    hook.simulateError = function () { func(new Error('DOMAIN ERROR')); };
  };
  var domain = initDomain(null, on);
  var cluster = initCluster();
  var l;
  var res = {
    setHeader: function (name, value) {
      t.equal('content-type', name, 'Domain error content type header');
      t.equal('text/plain', value, 'Domain error content type value');
    },
    end: function (data) {
      t.equal('Oops, there was a problem!\n', data, 'Domain error output');
    }
  };

  cluster.worker.disconnect = function () { t.pass('Cluster worker disconnected'); };
  forkWorker({
    launcher: function (func) {
      func(null, {
        requestListener: function () {}
      });
    },
    logger: function () {},
    cluster: cluster,
    domain: domain,
    createServer: function (listener) {
      l = listener;

      return {
        listen: noop,
        close: function () { t.pass('Closing server'); }
      };
    }
  });
  
  l(noop, res);
  hook.simulateError();
  t.equal(res.statusCode, 500, 'Status code check');
});

test('Log error on domain error', function (t) {
  t.plan(1);
  var simulateError;
  var on = function (type, func) {
    simulateError = function () { func(new Error('DOMAIN ERROR')); };
  };
  var domain = initDomain(null, on);
  var logger = function (err) {
    t.equal('DOMAIN ERROR', err.message);
    t.end();
  };
  var l;
  var res = {
    setHeader: noop,
    end: noop
  };

  forkWorker({
    launcher: initLauncher(),
    logger: logger,
    cluster: initCluster(),
    domain: domain,
    createServer: function (listener) {
      l = listener;

      return {
        listen: noop,
        close: noop
      }
    }
  });
  
  l(noop, res);
  simulateError();
});
