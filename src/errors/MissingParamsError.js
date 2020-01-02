const message = 'Missing Parameters';

module.exports = class MissingParamsError extends Error {
  constructor(params) {
    super(message);
    this.title = message;
    this.status = 400;
    this.code = 'MissingParamsError';
    this.detail = `The following body parameters were expected but not provided: ${params.join(
      ' | ',
    )}.`;
  }
};
