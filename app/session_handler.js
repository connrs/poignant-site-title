var Sessions = require('sessions');
var PostgresqlStore = require('../lib/postgres_session_store');

function initSessionHandler(client) {
  var options = {
    expires: null
  };
  var storeOptions = {
    client: client
  };
  var sessionHandler = new Sessions(PostgresqlStore, options, storeOptions);
  return sessionHandler;
}

module.exports = initSessionHandler;
