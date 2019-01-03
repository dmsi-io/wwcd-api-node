const express = require('express');
const http = require('http');
const cors = require('cors');
const bodyParser = require('body-parser');

const package = require('./package');
const { NotFoundError } = require('./src/node_modules/app/errors');
const getRoutes = require('./src/node_modules/app/utils/getRoutes');
const api = require('./src/node_modules/app');

const PORT = process.env.PORT || 8080;

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use((req, res, next) => {
  res.set('Powered-By', 'SCOTCH');
  res.set('Version', package.version);
  res.set('Server', 'A Raspberry Pi powered by an orange in the break room.');
  res.set('Recruiting', 'Busy inspecting headers during a Christmas party? You oughta be a web dev.');
  req.apiBase = req.protocol + '://' + req.get('host') + '/v1';

  return next();
});

app.get('/v1', (req, res) => {
  res.json({
    data: {
      type: 'Root',
      included: {},
      meta: {},
      links: Object.assign({}, getRoutes(req.apiBase), {
        self: `${req.apiBase}/`,
      }),
    },
  });
});

app.use('/v1', api(require('./service')()));

app.use((req, res, next) => {
  res.status(404).json({
    errors: [new NotFoundError()],
  })
});

app.use((err, req, res, next) => {
  console.log(err);
  res.statusCode = err.status || 500;
  res.json({
    errors: Array.isArray(err) ?
      [...err] :
      err,
  });
});

server.listen(PORT, () =>
  console.log(`Winner Winner 🐓🥘 running on port ${PORT}`)
);
