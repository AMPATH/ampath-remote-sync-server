var common = require('./common');
var config = require('./config');
var sprintf = require('sprintf').sprintf;
var exec = require('node-exec-promise').exec;
var fs = require('fs');
var moment = require('moment');
var targz = require('tar.gz');
var unique = require('array-unique');
var shell = require('shelljs');
var db = require('./db');
var recursive = require('recursive-readdir');
var uuid = require('node-uuid');
var extfs = require('extfs');

function dumpTable(server, table, options) {
  var replacements = {
    "%lastDump%": options.lastDump,
    "%cutOff%": options.cutOff
  };
  var where = table.where;
  where = where.replace(/%\w+%/g, function(all) {
    return replacements[all] || all;
  });
  var cmd = sprintf(
    "mysqldump -h %s --port=%s  \"%s\"  \"%s\" --compact --replace --default-character-set=utf8 --no-create-info --where=\"%s\"",
    server.host,
    server.port,
    server.database,
    table.name,
    where
  );
  return common.executeCmdAsync(cmd).then(function(data) {
    return {
      table: table.name,
      dump: data
    };
  }).catch(function(error) {
    console.log('Error ' + table.name, error);
    return {
      table: table.name,
      error: error
    };
  });
}

function saveDump(dump, fullPath) {
  return new Promise(function(resolve, reject) {
    if (dump.dump.length === 0) {
      resolve(fullPath);
    } else {
      fs.writeFile(fullPath + '/temp/' + dump.table + '.sql', dump.dump, function(err) {
        if (err) {
          reject(err);
        }
        resolve(fullPath);
      });
    }
  });
}

function preparePromises(lastDump, cutOff) {
  var promises = [];
  for (var table of config.tables) {
    promises.push(dumpTable(config.db.connection, table, {
      lastDump: lastDump,
      cutOff: cutOff
    }));
  }
  return promises;
}

function createFolders(dumps, timeStamp) {
  var dumpPromises = [];
  var path = config.dumpBase;
  var temp = config.dumpBase + '/temp';
  if (!fs.existsSync(path)) {

    fs.mkdirSync(path);
  }
  if (!fs.existsSync(temp)) {

    fs.mkdirSync(temp);
  }
  for (var dump of dumps) {
    dumpPromises.push(saveDump(dump, path));
  }
  return Promise.all(dumpPromises);
}

function prepareTarPromises(paths, timeStamp) {
  var promises = [];
  for (var path of paths) {
    promises.push(compressPath(path, timeStamp));
  }
  return promises;
}

function compressPath(path, timeStamp) {
  var name = path.match(/([^\/]*)\/*$/)[1];
  var compressed = config.dumpBase +
    timeStamp.replace(/\s+/g, '').replace(/:/g, '.') + '.tar.gz';
  var meta = {
    timeStamp: timeStamp,
    dumpUuid: uuid.v4()
  };
  return new Promise(function(resolve, reject) {
    var temp = path + 'temp/';
    extfs.isEmpty(temp, function(empty) {
      if (empty) {
        extfs.removeSync(temp);
        resolve({
          path: null,
          meta: meta
        });
      } else {
        fs.writeFileSync(temp + 'meta.json', JSON.stringify(meta, null, 2), 'utf-8');
        targz({
            level: 9, // Maximum compression
            memLevel: 9
          }, {
            fromBase: true // do not include top level directory
          }).compress(temp, compressed).then(function() {
            extfs.removeSync(temp);
            resolve({
              path: compressed,
              meta: meta
            });
          })
          .catch(function(err) {
            extfs.removeSync(temp);
            reject(err);
          });
      }
    });

  });
}

function insert(table, columns, values) {
  var sql = "INSERT INTO " + table + " (" + columns + ") VALUES ?";
  return new Promise(function(resolve, reject) {
    var connection = db.getConnection();
    connection.query(sql, values, function(err, rows) {
      if (err) {
        console.log('Error inserting dumps');
        reject(err);
        connection.end();
      }
      resolve(rows);
      connection.end();
    });
  });
}

function getLastDump() {
  return new Promise(function(resolve, reject) {
    var connection = db.getConnection();
    connection.query('SELECT * from dump_logs ORDER BY last_dump_time DESC Limit 1', function(err, rows) {
      if (err) {
        reject(err);
        connection.end();
      }
      var lastDump = null;
      if (rows.length > 0) {
        lastDump = moment(rows[0].last_dump_time).format('YYYY-MM-DD HH:mm:ss');
      }
      connection.end();
      resolve(lastDump);
    });
  });
}

function dumpDatabase() {
  var timeStamp = moment().format('YYYY-MM-DD HH:mm:ss');
  var previous = '';
  getLastDump().then(function(lastDump) {
    console.log(previous);
    previous = lastDump || config.initialCutOff;
    return Promise.all(preparePromises(previous, timeStamp));
  }).then(function(response) {
    return createFolders(response, timeStamp);
  }).then(function(res) {
    return Promise.all(prepareTarPromises(unique(res), timeStamp));
  }).then(function(compressedTars) {
    var rows = [];
    for (var tar of compressedTars) {
      var row = [];
      var meta = tar.meta || {};
      row.push(tar.path);
      row.push(tar.meta.timeStamp);
      row.push(previous);
      row.push(tar.meta.dumpUuid);
      rows.push(row);
    }

    //Log timeStamp as lastDump
    return insert('generated_zips', 'path,dump_time,previous_dump_time,dump_uuid', [rows]);
  }).then(function() {
    //Log timeStamp as lastDump
    var r = [
      [timeStamp]
    ];
    return insert('dump_logs', 'last_dump_time', [r]);
  }).catch(
    function(err) {
      //Log Error and delete any files already created
      console.log('Error Saving Dump', err);
    }
  );

}
module.exports = {
  dumpDatabase: dumpDatabase
};
