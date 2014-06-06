var Stomp = require('stomp-client');
var StompEmitter = require('stomp-emitter');

function initEvents (app, done) {
  app.stomp = new Stomp(app.env.stomp.host, app.env.stomp.port, app.env.stomp.username, app.env.stomp.password);
  app.events = new StompEmitter(app.stomp, process.pid);
  app.stomp.connect(function (session) {
    done();
  }, function (err) {
    console.error(err);
  });
};

module.exports = initEvents;
