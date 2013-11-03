# PG Sugar [![Build Status](https://secure.travis-ci.org/connrs/node-pg-sugar.png?branch=master)](http://travis-ci.org/connrs/node-pg-sugar)

A couple of methods to automate pooling with `pg`.

Create sugar

    var sugar = require('pg-sugar');
    var s = sugar(pg, connectionString);

Create a client to perform a query

    s.client(function (err, query) {
      query('SELECT 1', [], function (err, results) {
        // Do stuff
        // Client is automatically returned to the pool
      });
    });

Create a transaction client to run transactions

    s.transaction(function (err, client) {
      client.query('SELECT 2', [], function (err, results, client) {
        if (err) {
          client.rollback(function () { console.log('LOSE!'); });
        }
        else {
          client.commit(function () { console.log('WIN!'); });
        }
      });
    });
