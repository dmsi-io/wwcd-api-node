require('dotenv').config();

const express = require('express');
const http = require('http');
const cors = require('cors');
const bodyParser = require('body-parser');

const package = require('./package');
const { NotFoundError } = require('./src/errors');
const api = require('./src');
const init = require('./init');

const PORT = process.env.PORT || 8080;

require('./service')().then((service) => {
  const app = express();
  const server = http.createServer(app);

  app.use(cors());
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store, no-store');
    res.set('Powered-By', 'SCOTCH');
    res.set('Version', package.version);
    res.set('Server', 'A Raspberry Pi powered by an orange in the break room.');
    res.set(
      'Recruiting',
      'Busy inspecting headers during a Christmas party? You oughta be a web dev.',
    );
    req.apiBase = `${req.protocol}://${req.get('host')}/v1`;

    return next();
  });

  app.use('/v1', api(service));

  app.use((req, res, next) => {
    res.status(404).json({
      errors: [new NotFoundError()],
    });
  });

  app.use((err, req, res, next) => {
    console.log(err);
    res.statusCode = err.status || 500;
    res.json({
      errors: Array.isArray(err) ? [...err] : err,
    });
  });

  server.listen(PORT, () => {
    console.log(`Winner Winner 🐓🥘 running on port ${PORT}`);
    console.log("  Spinning up tables if they aren't already there.");
    init(service).then(() => console.log('  tables validated'));
  });

  const shutdown = (command) => () => {
    console.log(`Got ${command}. Shutting down.`);

    server.close((err) => {
      if (err) {
        console.log('Error closing server', err);
        process.exit(1);
      }

      service.db.end((err) => {
        if (err) {
          console.log('Error closing database', err);
          process.exit(1);
        }

        process.exit();
      });
    });
  };

  process.on('SIGTERM', shutdown('SIGTERM'));
  process.on('SIGINT', shutdown('SIGINT'));
  process.on('EXIT', shutdown('EXIT'));
});
