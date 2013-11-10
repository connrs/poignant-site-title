var lsr = require('lsr');
var RimyArseParapet = require('rimy-arse-parapet');
var StatTransform = require('./stat-transform');

function sthp(handlebars, path, done) {
  var files = lsr.stream(path, { filter: lsrStreamFilter });
  var rap = RimyArseParapet({ index: 1 });
  var stat = StatTransform();
  var errors = false;

  rap.on('data', function (data) {
    if (!errors) {
      try {
        handlebars.registerPartial(data[0], data[1].toString());
      }
      catch (err) {
        errors = true;
        rap.emit('error', err);
      }
    }
  });
  rap.on('error', done);
  rap.on('end', function () {
    if (!errors) {
      done();
    }
  });
  files.pipe(stat).pipe(rap);
}

function lsrStreamFilter(stat) {
  return stat.name.match(/\.hbs$/) || stat.isDirectory();
}

module.exports = sthp;
