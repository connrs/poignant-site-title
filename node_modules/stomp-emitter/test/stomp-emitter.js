var test = require('tape');
var StompEmitter = require('..');

test('Throws if no client passed in', function (t) {
  t.plan(1);
  t.throws(StompEmitter, 'No client provided to new StompEmitter constructor');
});

test('Throws if no process UID is passed in', function (t) {
  var client = function () {};

  t.plan(1);
  t.throws(StompEmitter.bind(null, client), 'No UID provided to new StompEmitter constructor');
});

test('on method subscribes to queue', function (t) {
  t.plan(1);
  var uid = process.pid;
  var client = {
    subscribe: function (queue, headers, callback) {
      t.equal(queue, '/queue/random_task');
    }
  };
  var emitter = new StompEmitter(client, uid);
  emitter.on('random_task', function () {});
});

test('on method subscribes to queue with uid', function (t) {
  t.plan(1);
  var uid = process.pid;
  var client = {
    subscribe: function (queue, headers, callback) {
      t.equal(queue, '/queue/' + uid + '/random_task');
    }
  };
  var emitter = new StompEmitter(client, uid);
  emitter.on('~random_task', function () {});
});

test('on method passes callback to subscribe', function (t) {
  t.plan(1);
  var uid = process.pid;
  var cbs = [];
  var client = {
    subscribe: function (queue, headers, callback) {
      cbs.push(callback);
    },
    publish: function (queue, body, headers) {
      cbs[0](body, headers);
    }
  };
  var emitter = new StompEmitter(client, uid);
  emitter.on('random_task', function (body, headers) {
    t.equal(body, 'testdata');
  });
  emitter.emit('random_task', 'testdata');
});

test('data is passed to callback function', function (t) {
  t.plan(1);
  var uid = process.pid;
  var cbs = [];
  var client = {
    subscribe: function (queue, headers, callback) {
      cbs.push(callback);
    },
    publish: function (queue, body, headers) {
      cbs[0](body, headers);
    }
  };
  var emitter = new StompEmitter(client, uid);
  emitter.on('random_task', function (data) {
    t.equal(data, 'testdata');
  });
  emitter.emit('random_task', 'testdata');
});

test('data is parsed when headers indicate JSON', function (t) {
  t.plan(1);
  var uid = process.pid;
  var cbs = [];
  var client = {
    subscribe: function (queue, headers, callback) {
      cbs.push(callback);
    },
    publish: function (queue, body, headers) {
      cbs[0](body, headers);
    }
  };
  var emitter = new StompEmitter(client, uid);
  emitter.on('random_task', function (data) {
    t.equal(data, true);
  });
  emitter.emit('random_task', 'true', {
    'content-type': 'application/json'
  });
});

test('data returned raw when JSON parse error', function (t) {
  t.plan(1);
  var uid = process.pid;
  var cbs = [];
  var client = {
    subscribe: function (queue, headers, callback) {
      cbs.push(callback);
    },
    publish: function (queue, body, headers) {
      cbs[0](body, headers);
    }
  };
  var emitter = new StompEmitter(client, uid);
  emitter.on('random_task', function (data) {
    t.equal(data, 'badJSONDATA');
  });
  emitter.emit('random_task', 'badJSONDATA', {
    'content-type': 'application/json'
  });
});

test('multiple listeners', function (t) {
  t.plan(3);
  var uid = process.pid;
  var cbs = [];
  var client = {
    subscribe: function (queue, headers, callback) {
      t.pass();
      cbs.push(callback);
    },
    publish: function (queue, body, headers) {
      cbs[0](body, headers);
    }
  };
  var emitter = new StompEmitter(client, uid);
  emitter.on('random_task', function (data) {
    t.equal(data, 'testdata');
  });
  emitter.on('random_task', function (data) {
    t.equal(data, 'testdata');
  });
  emitter.emit('random_task', JSON.stringify('testdata'), {
    'content-type': 'application/json'
  });
});

test('unsubscribe one queue', function (t) {
  t.plan(1);
  var uid = process.pid;
  var cbs = [];
  var client = {
    subscribe: function (queue, headers, callback) {
      cbs.push(callback);
    },
    publish: function (queue, body, headers) {
      cbs[0](body, headers);
    },
    unsubscribe: function (queue, headers) {
      t.pass();
    }
  };
  var emitter = new StompEmitter(client, uid);
  emitter.on('random_task', function (body, headers) {});
  emitter.removeAllListeners();
});

test('unsubscribe 1 queue with 2 handlers', function (t) {
  t.plan(1);
  var uid = process.pid;
  var cbs = [];
  var client = {
    subscribe: function (queue, headers, callback) {
      cbs.push(callback);
    },
    publish: function (queue, body, headers) {
      cbs[0](body, headers);
    },
    unsubscribe: function (queue, headers) {
      t.pass();
    }
  };
  var emitter = new StompEmitter(client, uid);
  emitter.on('random_task', function (body, headers) {});
  emitter.on('random_task', function (body, headers) {});
  emitter.removeAllListeners();
});

test('unsubscribe 2 queues with 2 handlers each', function (t) {
  t.plan(2);
  var uid = process.pid;
  var cbs = [];
  var client = {
    subscribe: function (queue, headers, callback) {
      cbs.push(callback);
    },
    publish: function (queue, body, headers) {
      cbs[0](body, headers);
    },
    unsubscribe: function (queue, headers) {
      t.pass();
    }
  };
  var emitter = new StompEmitter(client, uid);
  emitter.on('random_task', function (body, headers) {});
  emitter.on('random_task', function (body, headers) {});
  emitter.on('~random_task', function (body, headers) {});
  emitter.on('~random_task', function (body, headers) {});
  emitter.removeAllListeners();
});
