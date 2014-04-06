function Error500(message) {
  this.name = 'Error500';
  this.message = message || 'Internal Server Error';
  this.stack = (new Error()).stack;
  this.statusCode = 500;
}

Error500.prototype = Object.create(Error.prototype);

module.exports = Error500;
