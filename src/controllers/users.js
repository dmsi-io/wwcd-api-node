const get = require('lodash.get');

const uuidv4 = require('uuid/v4');

const {
  LockedError,
  MissingParamsError,
  NoMoreTicketsError,
  NotFoundError,
  UserIdMismatchError,
} = require('../errors');

const getStorageUrl = require('../utils/getStorageUrl');

const convertToOutputCase = (user) => ({
  id: user.id,
  firstName: user.firstname,
  lastName: user.lastname,
  username: user.username,
  password: user.password,
  image: user.image_key ? getStorageUrl(user.image_key) : null,
  tickets: user.tickets,
});

module.exports = (service) => ({
  create: async (p, q, body, u, file) => {
    const { firstName, lastName, username, password, tickets } = body;

    if (!firstName || !lastName || !username || !password || (!tickets && tickets !== 0)) {
      throw new MissingParamsError(['firstName', 'lastName', 'username', 'password', 'tickets']);
    }

    let imageKey = null;

    if (file) {
      imageKey = `emp_photos/${uuidv4()}`;

      try {
        await service.bucket.file(imageKey).save(file.buffer, {
          contentType: file.mimetype,
          resumable: false,
          metadata: {
            cacheControl: 'public, max-age=86400',
          },
        });
      } catch (e) {
        console.log(`Error uploading photo '${imageKey}'`, e);
        imageKey = null;
      }
    }

    const queryResult = await service.db.query(
      `INSERT INTO USERS (firstname, lastname, username, password, tickets, image_key) VALUES (?, ?, ?, ?, ?, ?)`,
      [firstName, lastName, username, password, tickets, imageKey],
    );

    const users = await service.db.query(
      `SELECT id, firstname, lastname, username, password, tickets, image_key FROM USERS WHERE id = ?`,
      queryResult.insertId,
    );

    if (users.length === 0) {
      throw new NotFoundError();
    }

    return convertToOutputCase(users[0]);
  },
  getAll: async () => {
    return service.db
      .query(`SELECT id, firstname, lastname, username, password, tickets, image_key FROM USERS`)
      .map(convertToOutputCase);
  },
  get: async ({ id }) => {
    const users = await service.db.query(
      `SELECT id, firstname, lastname, username, password, tickets, image_key FROM USERS WHERE id = ?`,
      id,
    );

    if (users.length === 0) {
      throw new NotFoundError();
    }

    return convertToOutputCase(users[0]);
  },
  update: async ({ id }, q, body, u, file) => {
    const { firstName, lastName, username, password, tickets, removeImage } = body;

    if (!firstName || !lastName || !username || !password || (!tickets && tickets !== 0)) {
      throw new MissingParamsError([
        'firstName',
        'lastName',
        'username',
        'password',
        'tickets',
        'removeImage',
      ]);
    }

    let users = await service.db.query(
      `SELECT id, firstname, lastname, username, password, tickets, image_key FROM USERS WHERE id = ?`,
      id,
    );

    if (users.length === 0) {
      throw new NotFoundError();
    }

    let imageKey = users[0].image_key;

    if ((file || removeImage) && !!imageKey) {
      try {
        await service.bucket.file(imageKey).delete();
      } catch (e) {
        console.log(`Error deleting photo '${imageKey}'`, e);
      }

      imageKey = null;
    }

    if (file) {
      imageKey = `emp_photos/${uuidv4()}`;

      try {
        await service.bucket.file(imageKey).save(file.buffer, {
          contentType: file.mimetype,
          resumable: false,
          metadata: {
            cacheControl: 'public, max-age=86400',
          },
        });
      } catch (e) {
        console.log(`Error uploading photo '${imageKey}'`, e);
        imageKey = null;
      }
    }

    await service.db.query(
      `UPDATE USERS SET firstname = ?, lastname = ?, username = ?, password = ?, tickets = ?, image_key = ? WHERE id = ?`,
      [firstName, lastName, username, password, tickets, imageKey, id],
    );

    users = await service.db.query(
      `SELECT id, firstname, lastname, username, password, tickets, image_key FROM USERS WHERE id = ?`,
      id,
    );

    if (users.length === 0) {
      throw new NotFoundError();
    }

    return convertToOutputCase(users[0]);
  },
  delete: async ({ id }) => {
    const users = await service.db.query(
      `SELECT id, firstname, lastname, username, password, tickets, image_key FROM USERS WHERE id = ?`,
      id,
    );

    if (users.length === 0) {
      throw new NotFoundError();
    }

    const imageKey = prizes[0].image_key;

    if (imageKey != null && !!imageKey) {
      try {
        await service.bucket.file(imageKey).delete();
      } catch (e) {
        console.log(`Error deleting photo '${imageKey}'`, e);
      }
    }

    await service.db.query(`DELETE FROM USERS WHERE id = ?`, id);

    return convertToOutputCase(users[0]);
  },
  getMe: async (p, q, b, user) => {
    const userData = await service.db.query(
      `SELECT id, firstname, lastname, username, password, tickets FROM USERS WHERE id = ?`,
      user.id,
    );

    const tickets = await service.db.query(
      `SELECT COUNT(0) AS tickets FROM TICKETS WHERE user_id = ?`,
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
      `SELECT id, category_id, title, description, image_key, committed_tickets, committed_users
      FROM PRIZES P
        INNER JOIN (
          SELECT prize_id, COUNT(0) AS committed_tickets, COUNT(DISTINCT user_id) as committed_users
          FROM TICKETS
          WHERE user_id = ?
          GROUP BY prize_id
        ) T
        ON P.id = T.prize_id`,
      user.id,
    );
    return userPrizes.map((userPrize) => ({
      id: userPrize.id,
      categoryId: userPrize.category_id,
      title: userPrize.title,
      description: userPrize.description,
      image: userPrize.image_key ? getStorageUrl(userPrize.image_key) : null,
      committedTickets: userPrize.committed_tickets,
      committedUsers: userPrize.committed_users,
    }));
  },
  commitTicket: async (p, q, body, userData) => {
    const { prize, user, ticketCount } = get(body, 'data.attributes');

    const locked =
      (await service.db.query(`SELECT COUNT(0) AS count FROM TICKETS WHERE used = 1`))[0].count > 0;

    if (locked) {
      throw new LockedError();
    }

    if (user !== userData.id) {
      throw new UserIdMismatchError(userData.id, user);
    }

    const existingPrize = await service.db.query(`SELECT id FROM PRIZES WHERE id = ?`, prize);

    if (existingPrize.length === 0) {
      throw new NotFoundError();
    }

    const tickets = await service.db.query(
      `SELECT COUNT(0) AS count FROM TICKETS WHERE user_id = ?`,
      userData.id,
    );

    if (userData.tickets - tickets[0].count < ticketCount) {
      throw new NoMoreTicketsError();
    }

    await Promise.all(
      Array(ticketCount)
        .fill(null)
        .map(() =>
          service.db.query(`INSERT INTO TICKETS (user_id, prize_id) VALUES (?, ?)`, [user, prize]),
        ),
    );

    return {
      user,
      prize,
    };
  },
  uncommitTicket: async (p, q, body, userData) => {
    const { prize, user } = get(body, 'data.attributes');

    const locked =
      (await service.db.query(`SELECT COUNT(0) AS count FROM TICKETS WHERE used = 1`))[0].count > 0;

    if (locked) {
      throw new LockedError();
    }

    if (user !== userData.id) {
      throw new UserIdMismatchError(userData.id, user);
    }

    const existingPrize = await service.db.query(`SELECT id FROM PRIZES WHERE id = ?`, prize);

    if (existingPrize.length === 0) {
      throw new NotFoundError();
    }

    await service.db.query(`DELETE FROM TICKETS WHERE user_id=? AND prize_id=?`, [user, prize]);

    return {
      user,
      prize,
    };
  },
});
