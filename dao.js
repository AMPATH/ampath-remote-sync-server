var db = require('./db');
var internals = {};

internals.getDumps = function(request, reply) {
  var connection = db.getConnection();
  var query = 'SELECT id,path,dump_time,dump_uuid FROM generated_zips  ORDER BY id DESC';
  var value = '';
  if (request.query.fromDate) {
    value = request.query.fromDate;
    query = 'SELECT id,path,dump_time,dump_uuid FROM generated_zips where dump_time > ? ORDER BY id DESC';
  }
  if (request.query.lastUuid) {
    value = request.query.lastUuid;
    query = 'SELECT id,path,dump_time,dump_uuid FROM `generated_zips` WHERE id > (SELECT MAX(id) FROM generated_zips WHERE dump_uuid = ?) ORDER BY id DESC';
  }
  connection.execute(query, [value], function(err, rows) {
    if (err) {
      console.log(err);
      reply('Error querying db');
    } else {
      reply(rows);
    }
  });
};
module.exports = internals;
