var EventEmitter = require('events').EventEmitter;

function Events() {};

Events.prototype = Object.create(EventEmitter.prototype, { constructor: Events });

function initEvents (app, done) {
  app.events = new Events();
  done();
};

module.exports = initEvents;
