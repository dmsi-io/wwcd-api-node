// 2020-21 party app only allowed one selection but the old system was still used,
// this controller is used to return what selection each user made

module.exports = (service) => ({
  getAll: async () => {
    const selections = await service.db.query(`
      SELECT tu.userId AS id, firstName, lastName, title, created, prizeId, used
      FROM (
          SELECT u.id AS userId, firstname, lastname, t.id AS ticketId, t.prize_id as prizeId, created, used
          FROM TICKETS t
            INNER JOIN USERS u
            ON t.user_id = u.id 
        ) tu
        INNER JOIN PRIZES p
        ON tu.prizeId = p.id	
      ORDER BY used ASC, created ASC
    `);

    return selections;
  },
});
