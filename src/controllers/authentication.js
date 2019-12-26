const { get } = require('lodash');
const jwt = require('jsonwebtoken');

const {
  PasswordMatchError,
  NoUserError,
  MissingParamsError,
  NotFoundError,
  UserExpiredError,
} = require('../errors');

module.exports = (service) => ({
  authenticateUser: async (p, q, body) => {
    const { username, password } = get(body, 'data.attributes', {});

    if (!username || !password) {
      throw new MissingParamsError(['username', 'password']);
    }

    const users = await service.db.query('SELECT * FROM USERS WHERE username = ?', username);

    console.log(users);

    if (users.length !== 1) {
      throw new NoUserError(username);
    }

    let user = users[0];

    if (!Object.keys(user).length) {
      throw new NoUserError(username);
    }

    if (user.password !== password) {
      throw new PasswordMatchError();
    }

    const token = jwt.sign(
      {
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        tickets: user.tickets,
        id: user.id,
      },
      service.configs.secretKey,
    );

    return { token, id: user.id };
  },
  authMiddleware: async (req, res, next) => {
    const authHeader = req.get('Authorization');

    if (!authHeader) {
      throw new NotFoundError();
    }

    const [_, token] = authHeader.split(' ');

    if (!token) {
      throw new NotFoundError();
    }

    try {
      req.user = jwt.verify(token, service.configs.secretKey);
    } catch (e) {
      throw new NotFoundError();
    }

    console.log(req.user);

    if (req.user.admin) {
      throw new NotFoundError();
    }

    const user = await service.db.query('SELECT id FROM USERS WHERE id = ?', req.user.id);

    if (user.length === 0) {
      return res.json({
        errors: [new UserExpiredError()],
      });
    }

    return next();
  },

  authenticateAdmin: async (p, q, body) => {
    const { username, password } = get(body, 'data.attributes', {});

    if (!username || !password) {
      throw new MissingParamsError(['username', 'password']);
    }

    const users = await service.db.query('SELECT * FROM ADMINS WHERE username = ?', username);

    if (users.length !== 1) {
      throw new NoUserError(username);
    }

    let user = users[0];

    if (!Object.keys(user).length) {
      throw new NoUserError(username);
    }

    if (user.password !== password) {
      throw new PasswordMatchError();
    }

    const token = jwt.sign(
      {
        username: user.username,
        id: user.id,
        admin: true,
      },
      service.configs.secretKey,
    );

    return { token, id: user.id };
  },
  authAdminMiddleware: async (req, res, next) => {
    const authHeader = req.get('Authorization');

    if (!authHeader) {
      throw new NotFoundError();
    }

    const [_, token] = authHeader.split(' ');

    if (!token) {
      throw new NotFoundError();
    }

    try {
      req.user = jwt.verify(token, service.configs.secretKey);
    } catch (e) {
      throw new NotFoundError();
    }

    if (!req.user.admin) {
      throw new NotFoundError();
    }

    const user = await service.db.query('SELECT id FROM ADMINS WHERE id = ?', req.user.id);

    if (user.length === 0) {
      return res.json({
        errors: [new UserExpiredError()],
      });
    }

    return next();
  },
});
