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
var fsex = require('extfs');

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
    "mysqldump -h %s --port=%s -u %s --password=\"%s\" \"%s\"  \"%s\" --compact --replace --no-create-info --where=\"%s\"",
    server.host,
    server.port,
    server.username,
    server.password,
    server.database,
    table.name,
    where
  );
  return common.executeCmdAsync(cmd).then(function(data) {
    return {
      table: table.name,
      dump: data
    };
  });
}

function saveDump(dump, fullPath) {
  return new Promise(function(resolve, reject) {
    if (dump.dump.length === 0) {
      resolve(fullPath);
    } else {
      fs.writeFile(fullPath + '/' + dump.table + '.sql', dump.dump, function(err) {
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
  for (var site of config.sites) {
    var path = config.dumpBase + site.tag;
    var compressed = config.dumpBase + 'compressed_' + site.tag;
    if (!fs.existsSync(path)) {
      fs.mkdirSync(path);
    }
    if (!fs.existsSync(compressed)) {
      fs.mkdirSync(compressed);
    }
    for (var dump of dumps) {
      dumpPromises.push(saveDump(dump, path));
    }
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
  var compressed = config.dumpBase + 'compressed_' + name + '/' +
    timeStamp + '.tar.gz';
  var meta = {
    timeStamp: timeStamp,
    dumpUuid: uuid.v4()
  };
  return new Promise(function(resolve, reject) {
    fsex.isEmpty(path, function(empty) {
      if (empty) {
        fsex.removeSync(path);
        resolve({
          site: name,
          path: 'no data',
          meta: meta
        });
      } else {
        fs.writeFileSync(path + '/meta.json', JSON.stringify(meta, null, 2), 'utf-8');
        targz().compress(path, compressed).then(function() {
            fsex.removeSync(path);
            resolve({
              site: name,
              path: compressed,
              meta: meta
            });
          })
          .catch(function(err) {
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
      console.log(lastDump);
      connection.end();
      resolve(lastDump);
    });
  });
}

function dumpDatabase() {
  var timeStamp = moment().format('YYYY-MM-DD HH:mm:ss');
  getLastDump().then(function(lastDump) {
    var initialCutOff = lastDump || config.initialCutOff;
    return Promise.all(preparePromises(initialCutOff, timeStamp));
  }).then(function(response) {
    return createFolders(response, timeStamp);
  }).then(function(res) {
    console.log('Locations to Tars', unique(res));
    return Promise.all(prepareTarPromises(unique(res), timeStamp));
  }).then(function(compressedTars) {
    console.log(compressedTars);
    var rows = [];
    for (var site of compressedTars) {
      var row = [];
      var meta = site.meta || {};
      row.push(site.site);
      row.push(site.path);
      row.push(site.meta.timeStamp);
      row.push(site.meta.dumpUuid);
      rows.push(row);
    }

    //Log timeStamp as lastDump
    return insert('generated_zips', 'site,path,dump_time,dump_uuid', [rows]);
  }).then(function() {
    //Log timeStamp as lastDump
    var r = [
      [timeStamp]
    ];
    return insert('dump_logs', 'last_dump_time', [r]);
  }).catch(
    function(err) {
      //Log Error and delete any files already created
      console.log('Error', err);
    }
  );

}
dumpDatabase();
