'use strict';

const Hapi = require('hapi');
const Inert = require('inert');
const Lout = require('lout');
const hapiAuthJWT = require('hapi-auth-jwt2');
const Vision = require('vision');
const Routes = require('./routes/routes');
const config = require('./config');
var dao = require('./dao');

const server = new Hapi.Server({});

const port = 8080;
const host = '0.0.0.0';
var people = { // our "users database"
  1: {
    id: 1,
    name: 'Jen Jones'
  }
};
var validate = function(decoded, request, callback) {
  var client = dao.getClientByName(decoded.name);
  // do your checks to see if the person is valid
  if (!client) {
    return callback(null, false);
  } else {
    return callback(null, true);
  }
};

server.connection({
  port: port,
  host: host
});

const loutRegister = {
  register: Lout,
  options: {
    endpoint: '/docs'
  }
};


server.register([Vision, Inert, hapiAuthJWT], function(err) {
  server.auth.strategy('jwt', 'jwt', {
    key: config.jwtSecret, // Never Share your secret key
    validateFunc: validate, // validate function defined above
    verifyOptions: {
      algorithms: ['HS256']
    } // pick a strong algorithm
  });

  server.auth.default('jwt');
  if (err) {
    console.error('Failed loading plugins');
    process.exit(1);
  }

  server.route(Routes);

  server.start(function() {
    console.log('Server running at:', server.info.uri);
  });
});

module.exports = server;
