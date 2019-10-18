const mysql = require("promise-mysql");

module.exports = async () => {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    socketPath: process.env.SQL_INSTANCE_CONNECTION_NAME
  });

  return {
    db,
    configs: {
      secretKey: "SMARTCUSTOMEROBSESSED_17002"
    }
  };
};
