const message = 'No Matching User';

module.exports = class NoUserError extends Error {
  constructor(username) {
    super(message);
    this.title = message;
    this.status = 401;
    this.code = 'NoUserError';
    this.detail = `A user with the username ${username} was not found.`;
  }
};
