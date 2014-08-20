var test = require('tape');
var Bookshelf = require('bookshelf');

test('Teardown', function (t) {
  Bookshelf.PG.knex.destroy(function () {
    t.end();
  })
})
