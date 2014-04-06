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

function NotFoundError(message) {
  this.name = 'NotFoundError';
  this.message = message || 'Not Found';
  this.statusCode = 404;
}

NotFoundError.prototype = Object.create(Error.prototype, { constructor: { value: NotFoundError } });

function InternalServerError(message) {
  this.name = 'InternalServerError';
  this.message = message || 'Internal Server Error';
  this.statusCode = 500;
}

InternalServerError.prototype = Object.create(Error.prototype, { constructor: { value: InternalServerError } });

module.exports = {
  BadRequestError: BadRequestError,
  NotAuthorizedError: NotAuthorizedError,
  NotFoundError: NotFoundError,
  InternalServerError: InternalServerError
};
