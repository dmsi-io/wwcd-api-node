const convertToOuputCase = (ticket) => ({
  id: ticket.id,
  userId: ticket.user_id,
  prizeId: ticket.prize_id,
  created: ticket.created,
});

module.exports = (service) => ({
  get: async (p, { since }) => {
    let tickets;
    if (since) {
      tickets = await service.db.query(
        `SELECT * FROM TICKETS WHERE created > ?`,
        new Date(since)
          .toISOString()
          .replace(/T/, ' ') // replace T with a space
          .replace(/\..+/, ''), // delete the dot and everything after
      );
    } else {
      tickets = await service.db.query(`SELECT * FROM TICKETS`);
    }

    return tickets.map(convertToOuputCase);
  },
});
