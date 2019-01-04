const message = 'All Available Tickets Committed';

module.exports = class NoMoreTicketsError extends Error {
  constructor() {
    super(message);
    this.title = message;
    this.status = 420;
    this.code = 'NoMoreTicketsError';
    this.detail = 'You have used your maximum number of allotted tickets.';
  }
};
