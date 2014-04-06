var Transform = require('stream').Transform;

function RequestStream(options) {
  options.objectMode = true;
  Transform.call(this, options);
  this.router = options.router;
}

RequestStream.prototype = Object.create(Transform.prototype, {
  constructor: { value: Transform }
});

RequestStream.prototype._transform = function (obj, encoding, done) {
  var action = this.router.action(obj.req);

  if (action instanceof Error) {
    done(action);
  }
  else {
    action(obj, done);
  }
};

module.exports = RequestStream;
