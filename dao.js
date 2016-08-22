const db = require('./db');
const config = require('./config');
const path = require('path');
var internals = {};
internals.getClientByName = function(name) {
  return config.clients.find(function(client) {
    return client.name === name;
  });
};
internals.getDumps = function(request, reply) {
  var connection = db.getConnection();
  var query = 'SELECT id,path,dump_time,previous_dump_time,dump_uuid FROM generated_zips  ORDER BY id DESC';
  var value = '';
  if (request.query.fromDate) {
    value = request.query.fromDate;
    query = 'SELECT id,path,dump_time,previous_dump_time,dump_uuid FROM generated_zips where dump_time > ? ORDER BY id DESC';
  }
  if (request.query.lastUuid) {
    value = request.query.lastUuid;
    query = 'SELECT id,path,dump_time,previous_dump_time,dump_uuid FROM `generated_zips` WHERE id > (SELECT MAX(id) FROM generated_zips WHERE dump_uuid = ?) ORDER BY id DESC';
  }
  connection.execute(query, [value], function(err, rows) {
    if (err) {
      console.log(err);
      reply('Error querying db');
    } else {
      var processedRows = [];
      for (var row of rows) {
        processedRows.push({
          filename: path.basename(row.path),
          uuid: row.dump_uuid,
          dateCreated: row.dump_time,
          sequenceNumber: row.id,
          deltaRange: {
            startDatetime: row.previous_dump_time,
            endDatetime: row.dump_time
          }
        });
      }
      reply({
        result: processedRows
      });
    }
  });
};
module.exports = internals;
