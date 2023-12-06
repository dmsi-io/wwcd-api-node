const uuidv4 = require('uuid/v4');

const { NotFoundError, MissingParamsError } = require('../errors');

const getStorageUrl = require('../utils/getStorageUrl');

const convertToOutputCase = (prize) => ({
  id: prize.id,
  categoryId: prize.category_id,
  title: prize.title,
  multiplier: prize.multiplier,
  description: prize.description,
  image: prize.image_key ? getStorageUrl(prize.image_key) : null,
  committedTickets: prize.committed_tickets,
});

module.exports = (service) => ({
  getAll: async () => {
    const prizes = await service.db.query(
      `
      SELECT id, category_id, title, multiplier, description, image_key, IFNULL(committed_tickets, 0) as committed_tickets
      FROM PRIZES P 
        LEFT JOIN (SELECT prize_id, COUNT(*) AS committed_tickets FROM TICKETS GROUP BY prize_id) T
        ON P.id = T.prize_id
      `,
    );

    return prizes.map(convertToOutputCase);
  },
  get: async ({ id }) => {
    const prizes = await service.db.query(
      `
      SELECT id, category_id, title, multiplier, description, image_key, IFNULL(committed_tickets, 0) as committed_tickets
      FROM PRIZES P
        LEFT JOIN (SELECT prize_id, COUNT(*) AS committed_tickets FROM TICKETS WHERE prize_id = ? GROUP BY prize_id) T
        ON P.id = T.prize_id
      WHERE P.id = ?
      `,
      [id, id],
    );

    if (prizes.length === 0) {
      throw new NotFoundError();
    }

    return convertToOutputCase(prizes[0]);
  },
  getDiffs: async (p, { since }) => {
    const prizesWithNewTickets = await service.db.query(
      `
      SELECT id, category_id, title, multiplier, description, image_key, committed_tickets
      FROM PRIZES P
        INNER JOIN (
          SELECT prize_id, COUNT(*) AS committed_tickets
          FROM TICKETS
          WHERE prize_id IN (SELECT prize_id FROM TICKETS WHERE created > ?)
          GROUP BY prize_id
        ) T
        ON P.id = T.prize_id
      `,
      new Date(since)
        .toISOString()
        .replace(/T/, ' ') // replace T with a space
        .replace(/\..+/, ''), // delete the dot and everything after
    );

    return prizesWithNewTickets.map(convertToOutputCase);
  },
  update: async ({ id }, q, body, u, file) => {
    const { categoryId, title, multiplier = 1, description, removeImage } = body;

    if (!categoryId || !title || !description) {
      throw new MissingParamsError(['categoryId', 'title', 'description', 'removeImage']);
    }

    let prizes = await service.db.query(
      `SELECT id, category_id, title, multiplier, description, image_key FROM PRIZES WHERE id = ?`,
      id,
    );

    if (prizes.length === 0) {
      throw new NotFoundError();
    }

    let imageKey = prizes[0].image_key;

    if ((file || removeImage) && !!imageKey) {
      try {
        await service.bucket.file(imageKey).delete();
      } catch (e) {
        console.log(`Error deleting photo '${imageKey}'`, e);
      }

      imageKey = null;
    }

    if (file) {
      imageKey = `photos/${uuidv4()}`;

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
      `UPDATE PRIZES SET image_key = ?, category_id = ?, title = ?, multiplier = ?, description = ? WHERE id = ?`,
      [imageKey, categoryId, title, multiplier, description, id],
    );

    prizes = await service.db.query(
      `SELECT id, category_id, title, multiplier, description, image_key FROM PRIZES WHERE id = ?`,
      id,
    );

    if (prizes.length === 0) {
      throw new NotFoundError();
    }

    return convertToOutputCase(prizes[0]);
  },
  create: async (p, q, body, u, file) => {
    const { categoryId, title, multiplier = 1, description } = body;

    if (!categoryId || !title || !description) {
      throw new MissingParamsError(['categoryId', 'title', 'description']);
    }

    let imageKey = null;

    if (file) {
      imageKey = `photos/${uuidv4()}`;

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

    const results = await service.db.query(
      `INSERT INTO PRIZES(category_id, title, multiplier, description, image_key) VALUES (?, ?, ?, ?, ?)`,
      [categoryId, title, multiplier, description, imageKey],
    );

    const prizes = await service.db.query(
      `SELECT id, category_id, title, multiplier, description, image_key FROM PRIZES WHERE id = ?`,
      results.insertId,
    );

    if (prizes.length === 0) {
      throw new NotFoundError();
    }

    return convertToOutputCase(prizes[0]);
  },
  delete: async ({ id }) => {
    const prizes = await service.db.query(`SELECT * FROM PRIZES WHERE id = ?`, id);

    if (prizes.length === 0) {
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

    await service.db.query(`DELETE FROM PRIZES WHERE id = ?`, id);

    return convertToOutputCase(prizes[0]);
  },
});
