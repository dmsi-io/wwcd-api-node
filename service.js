const mysql = require('promise-mysql');

const { Storage } = require('@google-cloud/storage');

module.exports = async () => {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    socketPath: process.env.SQL_INSTANCE_CONNECTION_NAME,
  });

  const bucket = new Storage({
    projectId: 'wwcd-2019',
  }).bucket(process.env.BUCKET_NAME);

  return {
    db,
    bucket,
    configs: {
      secretKey: 'SMARTCUSTOMEROBSESSED_17002',
    },
  };
};
