var test = require('tape');
var transaction = require('../lib/transaction.js');
var noop = function () {};
var connect;
var client;

test('Returns error if error connecting', function (t) {
  t.plan(1);
  connect = function (done) {
    done(new Error('PGSQL ERROR'));
  };
  transaction(connect, function (err) {
    t.equal(err.message, 'PGSQL ERROR');
  });
});

test('If no error starts transaction', function (t) {
  t.plan(1);
  client = {
    query: function (query, params, done) {
      t.equal(query, 'BEGIN');
    }
  };
  connect = function (done) {
    done(null, client);
  };
  transaction(connect, noop);
});

test('If begin fails, return client', function (t) {
  t.plan(1);
  client = {
    query: function (query, params, done) {
      done(new Error('PGSQL ERROR'));
    }
  };
  connect = function (done) {
    done(null, client, function (err) {
      t.equal(err.message, 'PGSQL ERROR');
    });
  };
  transaction(connect, noop);
});

test('If begin fails, return error', function (t) {
  t.plan(1);
  client = {
    query: function (query, params, done) {
      done(new Error('PGSQL ERROR'));
    }
  };
  connect = function (done) {
    done(null, client, noop);
  };
  transaction(connect, function (err) {
    t.equal(err.message, 'PGSQL ERROR');
  });
});

test('If begin succeeds, return client', function (t) {
  t.plan(3);
  client = {
    query: function (query, params, done) {
      t.pass();
      done(null, {rows: []});
    }
  };
  connect = function (done) {
    done(null, client, noop);
  };
  transaction(connect, function (err, client) {
    t.error(err);
    client.query('SELECT 1', [], noop);
  });
});

test('Two queries', function (t) {
  t.plan(4);
  client = {
    query: function (query, params, done) {
      t.pass();
      done(null, {rows: []});
    }
  };
  connect = function (done) {
    done(null, client, noop);
  };
  transaction(connect, function (err, client) {
    client.query('SELECT 1', [], function (err, res, client) {
      client.query('SELECT 2', [], function (err, res, client) {
        t.pass();
      });
    });
  });
});

test('Three queries', function (t) {
  var count = 0;
  t.plan(5);
  client = {
    query: function (query, params, done) {
      if (count === 0) {
        t.equal(query, 'BEGIN');
      }
      else {
        t.equal(query, 'SELECT ' + count);
      }
      count++;
      done(null, {rows: []});
    }
  };
  connect = function (done) {
    done(null, client, noop);
  };
  transaction(connect, function (err, client) {
    client.query('SELECT 1', [], function (err, res, client) {
      client.query('SELECT 2', [], function (err, res, client) {
        client.query('SELECT 3', [], function (err, res, client) {
          t.pass();
        });
      });
    });
  });
});

test('Commit', function (t) {
  var count = 0;
  t.plan(3);
  client = {
    query: function (query, parans, done) {
      if (count === 0) {
        count++;
      }
      else {
        t.equal(query, 'COMMIT');
      }

      done(null, {rows: []});
    }
  };
  connect = function (done) {
    done(null, client, function (err) {
      t.pass();
    });
  };
  transaction(connect, function (err, client) {
    client.commit(function (err) {
      t.pass();
    });
  });
});

test('Commit error', function (t) {
  var count = 0;
  t.plan(3);
  client = {
    query: function (query, parans, done) {
      if (count === 0) {
        count++;
        done(null, {rows: []});
      }
      else {
        t.equal(query, 'COMMIT');
        done(new Error('PGSQL ERROR'));
      }

    }
  };
  connect = function (done) {
    done(null, client, function (err) {
      t.equal(err.message, 'PGSQL ERROR');
    });
  };
  transaction(connect, function (err, client) {
    client.commit(function (err) {
      t.equal(err.message, 'PGSQL ERROR');
    });
  });
});

test('Rollback', function (t) {
  var count = 0;
  t.plan(3);
  client = {
    query: function (query, parans, done) {
      if (count === 0) {
        count++;
      }
      else {
        t.equal(query, 'ROLLBACK');
      }

      done(null, {rows: []});
    }
  };
  connect = function (done) {
    done(null, client, function (err) {
      t.pass();
    });
  };
  transaction(connect, function (err, client) {
    client.rollback(function (err) {
      t.pass();
    });
  });
});

test('Rollback error', function (t) {
  var count = 0;
  t.plan(3);
  client = {
    query: function (query, parans, done) {
      if (count === 0) {
        count++;
        done(null, {rows: []});
      }
      else {
        t.equal(query, 'ROLLBACK');
        done(new Error('PGSQL ERROR'));
      }

    }
  };
  connect = function (done) {
    done(null, client, function (err) {
      t.equal(err.message, 'PGSQL ERROR');
    });
  };
  transaction(connect, function (err, client) {
    client.rollback(function (err) {
      t.equal(err.message, 'PGSQL ERROR');
    });
  });
});
