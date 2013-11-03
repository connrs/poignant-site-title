var client = require('./client.js');
var transaction = require('./transaction.js');

function sugar(pg, conString) {
  var pgConnect = pg.connect.bind(pg, conString);

  return {
    client: client.bind(client, pgConnect),
    transaction: transaction.bind(transaction, pgConnect)
  };
}

module.exports = sugar;
