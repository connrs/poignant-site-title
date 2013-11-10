var test = require('tape');
var handlebars = require('handlebars');
var stph = require('..');

test('One file', function (t) {
  t.plan(2);
  var f = stph(handlebars, __dirname + '/files/one-file');
  f.on('data', function (data) {
    t.equal(data[0], 'a_template');
    t.equal(data[1](), 'This is a template\n');
  });
});

test('Two files', function (t) {
  t.plan(2);
  var f = stph(handlebars, __dirname + '/files/two-files');
  var compiled = [];
  f.on('data', function (data) {
    compiled[data[0]] = data[1];
  });
  f.on('end', function () {
    t.equal(compiled.file_one({ greeting: 'Hello' }), 'Hello template one\n');
    t.equal(compiled.file_two({ greeting: 'Felicitations' }), 'Felicitations template two\n');
  });
});

test('One file within subdirectory', function (t) {
  t.plan(2);
  var f = stph(handlebars, __dirname + '/files/one-file-within-subdirectory');
  f.on('data', function (data) {
    t.equal(data[0], 'subdir_template');
    t.equal(data[1](), 'This is a template\n');
  });
});
