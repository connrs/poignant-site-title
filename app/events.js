var StompEmitter = require('stomp-emitter');

function initEvents (app, done) {
  app.events = new StompEmitter(app.stomp, process.pid);
  done();
};

module.exports = initEvents;
