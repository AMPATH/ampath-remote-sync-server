'use strict';

var Joi = require('joi');
var db = require('../db');
var internals = {};

internals.getDumps = function(request, reply) {
  var connection = db.getConnection();
  connection.execute('SELECT * FROM generated_zips WHERE site = ? ORDER BY id DESC', [request.query.site_tag], function(err, rows) {
    if (err) {
      console.log(err);
      reply('Error querying db');
    } else {
      reply(rows);
    }
  });
};

module.exports = [{
  method: 'GET',
  path: '/db-updates',
  config: {
    validate: {
      query: {
        site_tag: Joi.string()
      }
    },
    handler: internals.getDumps
  }
}];

internals.products = [{
  id: 1,
  name: 'Guitar'
}, {
  id: 2,
  name: 'Banjo'
}];
