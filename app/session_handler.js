var Sessions = require('sessions');
var Store = require('sessions-pg-store');

function initSessionHandler(client) {
  var options = {
    expires: null
  };
  var storeOptions = {
    client: client
  };
  var sessionHandler = new Sessions(Store, options, storeOptions);
  return sessionHandler;
}

module.exports = initSessionHandler;
