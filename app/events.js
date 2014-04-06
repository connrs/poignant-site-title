var Stomp = require('stomp-client');
var StompEmitter = require('stomp-emitter');

function initEvents (app, done) {
  app.stomp = new Stomp(app.env.stomp.host);
  app.events = new StompEmitter(app.stomp, process.pid);
  app.stomp.connect(function (session) {
    done();
  });
};

module.exports = initEvents;
