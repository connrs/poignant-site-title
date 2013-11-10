var test = require('tape');
var sthp = require('..');
var handlebars = function () {};

test('One partial', function (t) {
  t.plan(3);
  handlebars.registerPartial = function (name, template) {
    t.equal(name, 'partial_one');
    t.equal(template, 'This is a partial\n');
  };
  sthp(handlebars, __dirname + '/files/one-partial', function (err) {
    t.error(err);
  });
});

test('Two partials', function (t) {
  var i = 0;
  t.plan(5);
  handlebars.registerPartial = function (name, template) {
    if (i === 0) {
      t.equal(name, 'partial_one');
      t.equal(template, 'This is a partial\n');
    }
    else {
      t.equal(name, 'partial_two');
      t.equal(template, 'This is a second partial\n');
    }
    i++;
  };
  sthp(handlebars, __dirname + '/files/two-partials', function (err) {
    t.error(err);
  });
});

test('Errors if handlebars error encountered', function (t) {
  t.plan(1);
  handlebars.registerPartial = function (name, template) {
    throw new Error('SOME HANDLEBARS ERROR');
  };
  sthp(handlebars, __dirname + '/files/one-partial', function (err) {
    t.equal(err.message, 'SOME HANDLEBARS ERROR');
  });
});
