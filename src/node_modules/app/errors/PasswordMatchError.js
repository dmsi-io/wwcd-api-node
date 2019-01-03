const message = 'Not Authorized';

module.exports = class PasswordMatchError extends Error {
  constructor() {
    super(message);
    this.title = message;
    this.status = 401;
    this.code = 'PasswordMatchError';
    this.detail = 'The username and password provided did not match.';
  }
};
