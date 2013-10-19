var Stomp = require('stomp-client');

function initStomp(app, callback) {
  app.stomp = new Stomp(app.env.stomp.host);
  app.stomp.connect(function (session) {
    callback();
  });
}

module.exports = initStomp;
