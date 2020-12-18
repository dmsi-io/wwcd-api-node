const express = require('express');
const { uniqBy } = require('lodash');
const multer = require('multer');

var upload = multer();

const jsonApiWrapper = require('./utils/jsonApiWrapper');
const prizesController = require('./controllers/prizes');
const authenticationController = require('./controllers/authentication');
const usersController = require('./controllers/users');
const categoriesController = require('./controllers/categories');
const ticketController = require('./controllers/tickets');
const selectionsController = require('./controllers/selections');

module.exports = (service) => {
  const router = express.Router();

  const prizes = prizesController(service);
  const users = usersController(service);
  const auth = authenticationController(service);
  const categories = categoriesController(service);
  const tickets = ticketController(service);
  const selections = selectionsController(service);

  router.post('/authenticate', jsonApiWrapper(auth.authenticateUser)('token'));
  router.post('/authenticateadmin', jsonApiWrapper(auth.authenticateAdmin)('token'));

  router.get('/prizes', jsonApiWrapper(prizes.getAll)('prize'));
  router.get('/prizes/diff', jsonApiWrapper(prizes.getDiffs)('prize'));
  router.get('/prizes/:id', jsonApiWrapper(prizes.get)('prize'));
  router.get('/categories', jsonApiWrapper(categories.getAll)('category'));

  router.get('/users/me', auth.authMiddleware, jsonApiWrapper(users.getMe)('user'));
  router.post(
    '/users/me/tickets',
    auth.authMiddleware,
    jsonApiWrapper(users.commitTicket)('ticket'),
  );
  router.get(
    '/users/me/prizes',
    auth.authMiddleware,
    jsonApiWrapper(users.getPrizes)('user_prize'),
  );

  router.put(
    '/prizes/:id',
    auth.authAdminMiddleware,
    upload.single('image'),
    jsonApiWrapper(prizes.update)('prize'),
  );
  router.post(
    '/prizes',
    auth.authAdminMiddleware,
    upload.single('image'),
    jsonApiWrapper(prizes.create)('prize'),
  );
  router.delete('/prizes/:id', auth.authAdminMiddleware, jsonApiWrapper(prizes.delete)('prize'));

  router.get('/users', auth.authAdminMiddleware, jsonApiWrapper(users.getAll)('user'));
  router.get('/users/:id', auth.authAdminMiddleware, jsonApiWrapper(users.get)('user'));
  router.put('/users/:id', auth.authAdminMiddleware, jsonApiWrapper(users.update)('user'));
  router.post('/users', auth.authAdminMiddleware, jsonApiWrapper(users.create)('user'));
  router.delete('/users/:id', auth.authAdminMiddleware, jsonApiWrapper(users.delete)('user'));

  router.get('/tickets', auth.authAdminMiddleware, jsonApiWrapper(tickets.get)('ticket'));
  router.post(
    '/tickets/markused',
    auth.authAdminMiddleware,
    jsonApiWrapper(tickets.markUsed)('ticket'),
  );
  router.post(
    '/tickets/clearused',
    auth.authAdminMiddleware,
    jsonApiWrapper(tickets.clearUsed)('ticket'),
  );

  router.get(
    '/selections',
    auth.authAdminMiddleware,
    jsonApiWrapper(selections.getAll)('selection'),
  );

  router.get('/', (req, res) => {
    const routes = uniqBy(router.stack.map((r) => r.route.path));

    res.json({
      data: {
        type: 'Root',
        included: {},
        meta: {},
        links: routes.map((route) => ({ path: `${req.apiBase}${route}` })),
      },
    });
  });

  return router;
};
