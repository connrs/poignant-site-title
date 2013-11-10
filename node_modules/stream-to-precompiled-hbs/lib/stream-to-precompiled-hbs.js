var lsr = require('lsr');
var RimyArseParapet = require('rimy-arse-parapet');
var CompileTransform = require('./compile-transform');
var StatTransform = require('./stat-transform');
var PassThrough = require('stream').PassThrough;

function stph(handlebars, path) {
  var files = lsr.stream(path, { filter: function (stat) { return stat.name.match(/\.hbs$/) || stat.isDirectory(); } });
  var rap = RimyArseParapet({ index: 1 });
  var compile = CompileTransform(handlebars);
  var stat = StatTransform();
  var end = new PassThrough({objectMode: true});

  files.pipe(stat).pipe(rap).pipe(compile).pipe(end);

  return end;
}

module.exports = stph;
