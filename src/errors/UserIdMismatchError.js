const message = 'UserID Mismatch';

module.exports = class UserIdMismatchError extends Error {
  constructor(auth, body) {
    super(message);
    this.title = message;
    this.status = 401;
    this.code = 'UserIdMismatchError';
    this.detail = `The userID provided in the authorization token (${auth}) does not match the userID provided in the request body (${body})`;
  }
};
