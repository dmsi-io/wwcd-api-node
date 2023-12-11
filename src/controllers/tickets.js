const get = require('lodash.get');

const { MissingParamsError } = require('../errors');

const convertToOutputCase = (ticket) => ({
  id: ticket.id,
  userId: ticket.user_id,
  prizeId: ticket.prize_id,
  created: ticket.created,
  used: ticket.used === 1,
});

module.exports = (service) => ({
  get: async (p, { since }) => {
    let tickets;
    if (since) {
      tickets = await service.db.query(
        `SELECT id, user_id, prize_id, created, used FROM TICKETS WHERE created > ?`,
        new Date(since)
          .toISOString()
          .replace(/T/, ' ') // replace T with a space
          .replace(/\..+/, ''), // delete the dot and everything after
      );
    } else {
      tickets = await service.db.query(`SELECT id, user_id, prize_id, created, used FROM TICKETS`);
    }

    return tickets.map(convertToOutputCase);
  },
  getLocked: async () => {
    return (
      (await service.db.query('SELECT COUNT(*) AS count FROM TICKETS WHERE used = 1'))[0].count > 0
    );
  },
  markUsed: async (p, q, body) => {
    const { prizeId, userId } = get(body, 'data.attributes');

    if (!prizeId || !userId) {
      throw new MissingParamsError(['prizeId', 'userId']);
    }

    await service.db.query(`UPDATE TICKETS SET used = 1 WHERE prize_id = ? AND user_id = ?`, [
      prizeId,
      userId,
    ]);
  },
  clearUsed: async (p, q, body) => {
    const { prizeId } = get(body, 'data.attributes') || {};

    if (prizeId) {
      await service.db.query(`UPDATE TICKETS SET used = 0 WHERE prize_id = ?`, prizeId);
    } else {
      await service.db.query(`UPDATE TICKETS SET used = 0`);
    }
  },
});
