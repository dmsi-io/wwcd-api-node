const { get } = require('lodash');

const { NoMoreTicketsError, UserIdMismatchError, NotFoundError } = require('../errors');

const getStorageUrl = require('../utils/getStorageUrl');

const convertToOuputCase = (user) => ({
  id: user.id,
  firstName: user.firstname,
  lastName: user.lastname,
  username: user.username,
  password: user.password,
  tickets: user.tickets,
});

module.exports = (service) => ({
  create: async (p, q, body) => {
    const { firstName, lastName, username, password, tickets } = get(body, 'data.attributes');

    if (!firstName || !lastName || !username || !password || (!tickets && tickets !== 0)) {
      throw new MissingParamsError(['firstName', 'lastName', 'username', 'password', 'tickets']);
    }

    const queryResult = await service.db.query(
      `
      INSERT INTO USERS (firstname, lastname, username, password, tickets) VALUES (?, ?, ?, ?, ?)
    `,
      [firstName, lastName, username, password, tickets],
    );

    const users = await service.db.query(`SELECT * FROM USERS WHERE id = ?`, queryResult.insertId);

    if (users.length === 0) {
      throw new NotFoundError();
    }

    return convertToOuputCase(users[0]);
  },
  getAll: async () => {
    return service.db.query(`SELECT * FROM USERS`).map(convertToOuputCase);
  },
  get: async ({ id }) => {
    const users = await service.db.query(`SELECT * FROM USERS WHERE id = ?`, id);

    if (users.length === 0) {
      throw new NotFoundError();
    }

    return convertToOuputCase(users[0]);
  },
  update: async ({ id }, q, body) => {
    const { firstName, lastName, username, password, tickets } = get(body, 'data.attributes');

    if (!firstName || !lastName || !username || !password || (!tickets && tickets !== 0)) {
      throw new MissingParamsError(['firstName', 'lastName', 'username', 'password', 'tickets']);
    }

    await service.db.query(
      `
      UPDATE USERS SET firstname = ?, lastname = ?, username = ?, password = ?, tickets = ? WHERE id = ?
      `,
      [firstName, lastName, username, password, tickets, id],
    );

    const users = await service.db.query(`SELECT * FROM USERS WHERE id = ?`, id);

    if (users.length === 0) {
      throw new NotFoundError();
    }

    return convertToOuputCase(users[0]);
  },
  delete: async ({ id }) => {
    const users = await service.db.query(`SELECT * FROM USERS WHERE id = ?`, id);

    if (users.length === 0) {
      throw new NotFoundError();
    }

    await service.db.query(`DELETE FROM USERS WHERE id = ?`, id);

    return convertToOuputCase(users[0]);
  },
  getMe: async (p, q, b, user) => {
    const userData = await service.db.query(`SELECT * FROM USERS WHERE id = ?`, user.id);

    const tickets = await service.db.query(
      `SELECT COUNT(*) AS tickets FROM TICKETS WHERE user_id = ?`,
      user.id,
    );

    return Object.assign({}, userData[0], {
      tickets: {
        total: user.tickets,
        remaining: user.tickets - tickets[0].tickets,
      },
      iat: undefined, // blank out the iat from the token
      id: user.id,
    });
  },
  getPrizes: async (p, q, b, user) => {
    const userPrizes = await service.db.query(
      `
      SELECT id, category_id, title, description, image_key, committed_tickets
      FROM PRIZES P
        INNER JOIN (
          SELECT prize_id, COUNT(*) AS committed_tickets
          FROM TICKETS
          WHERE user_id = ?
          GROUP BY prize_id
        ) T
        ON P.id = T.prize_id
      `,
      user.id,
    );
    return userPrizes.map((userPrize) => ({
      id: userPrize.id,
      categoryId: userPrize.category_id,
      title: userPrize.title,
      description: userPrize.description,
      image: userPrize.image_key ? getStorageUrl(userPrize.image_key) : null,
      committedTickets: userPrize.committed_tickets,
    }));
  },
  commitTicket: async (p, q, body, userData) => {
    const { prize, user, ticketCount } = get(body, 'data.attributes');

    if (user !== userData.id) {
      throw new UserIdMismatchError(userData.id, user);
    }

    const existingPrize = await service.db.query(`SELECT id FROM PRIZES WHERE id = ?`, prize);

    if (existingPrize.length === 0) {
      throw new NotFoundError();
    }

    const tickets = await service.db.query(
      `SELECT COUNT(*) FROM TICKETS WHERE user_id = ?`,
      userData.id,
    );

    if (userData.tickets - tickets[0].length < ticketCount) {
      throw new NoMoreTicketsError();
    }

    await Promise.all(Array(ticketCount).fill(null).map(() => service.db.query(
      `INSERT INTO TICKETS (user_id, prize_id) VALUES (?, ?)`,
      [user, prize],
    )));

    return {
      user,
      prize,
    };
  },
});
