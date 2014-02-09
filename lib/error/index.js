function BadRequestError(message) {
  this.name = 'BadRequestError';
  this.message = message || 'Bad Request';
  this.statusCode = 400;
}

BadRequestError.prototype = Object.create(Error.prototype, { constructor: { value: BadRequestError } });

function NotAuthorizedError(message) {
  this.name = 'NotAuthorizedError';
  this.message = message || 'Not Authorized';
  this.statusCode = 403;
}

NotAuthorizedError.prototype = Object.create(Error.prototype, { constructor: { value: NotAuthorizedError } });

module.exports = {
  BadRequestError: BadRequestError,
  NotAuthorizedError: NotAuthorizedError
};
