// Update with your config settings.
const dotenv = require('dotenv');
dotenv.config();
const { DB_PORT, DB_PASSWORD, DB_NAME, DB_USER, DB_HOST } = process.env;

// const DB_HOST = 'localhost';
const connection = {
  host: DB_HOST || 'localhost',
  user: DB_USER,
  port: parseInt(DB_PORT) || 1433,
  database: DB_NAME,
};
console.info('Using knex against', connection);
connection.password = DB_PASSWORD;
module.exports = {
  client: 'pg',
  seeds: {
    directory: './seeds',
  },
  connection,
};
