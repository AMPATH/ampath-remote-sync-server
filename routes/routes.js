'use strict';
var dao = require('../dao');
var Joi = require('joi');
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
    validate: {
      query: schema
    },
    handler: dao.getDumps
  }
}];
