module.exports = (service) => ({
  getAll: async () => service.db.query('SELECT id, name, image FROM CATEGORIES'),
});
