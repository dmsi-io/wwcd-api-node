const message = 'Ticket moves are now locked';

module.exports = class LockedError extends Error {
  constructor() {
    super(message);
    this.title = message;
    this.status = 401;
    this.code = 'LockedError';
    this.detail = 'Tickets cannot be moved once the prize has been drawn.';
  }
};
