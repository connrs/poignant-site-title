function Error404(message) {
  this.name = 'Error404';
  this.message = message || 'Not Found';
  this.stack = (new Error()).stack;
  this.statusCode = 404;
}

Error404.prototype = Object.create(Error.prototype);

module.exports = Error404;
