module.exports = (service) => ({
  getAll: async () => {
    const categories = await service.db.query('SELECT * FROM CATEGORIES');

    return categories;
  },
});
