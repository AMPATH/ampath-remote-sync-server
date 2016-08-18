var mysql = require('mysql2');
var config = require('./config');

function getConnection() {
  return mysql.createConnection(config.mysql);
}
exports.getConnection = getConnection;
