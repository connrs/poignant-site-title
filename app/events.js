var EventEmitter = require('events').EventEmitter;

function initEvents (app) {
  function Events() {};
  Events.prototype = Object.create(EventEmitter.prototype, { constructor: Events });
  app.events = new Events();
};

module.exports = initEvents;
