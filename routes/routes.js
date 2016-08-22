'use strict';
var dao = require('../dao');
var Joi = require('joi');
var JWT = require('jsonwebtoken');
const config = require('../config');
var schema = Joi.alternatives().try(
  Joi.object().keys({
    lastUuid: Joi.string().allow(''),
    fromDate: Joi.string()
  }),
  Joi.object().keys({
    lastUuid: Joi.string(),
    fromDate: Joi.string().allow('')
  })
);
module.exports = [{
  method: 'GET',
  path: '/db-updates',
  config: {
    auth: false,
    validate: {
      query: schema
    },
    handler: dao.getDumps
  }
}, { // implement your own login/auth function here
  method: ['GET', 'POST'],
  path: "/auth",
  config: {
    auth: false
  },
  handler: function(request, reply) {
    var name = request.query.name || request.payload.name;
    var client = dao.getClientByName(name);
    var session = {
      id: client.id,
      name: client.name,
      exp: new Date().getTime() + 30 * 60 * 1000 // expires in 30 minutes time
    };
    // sign the session as a JWT
    var payload = {};
    if (client.password === request.payload.password) {
      payload.status = 'success';
      payload.token = JWT.sign(session, config.jwtSecret);
    } else {
      payload.status = 'error';
      payload.message = 'wrong credentials';
    }
    reply(payload);
  }
}];
