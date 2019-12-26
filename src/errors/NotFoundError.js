const message = 'Not Found';

module.exports = class NotFoundError extends Error {
  constructor() {
    super(message);
    this.title = message;
    this.status = 404;
    this.code = 'NotFoundError';
    this.detail = 'The resource you requested could not be found.';
  }
};
