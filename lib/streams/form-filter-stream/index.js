var BarnacleMode = require('barnacle-mode');
var xtend = require('xtend');
var ignoreKeys = ['page', 'limit'];

function isValidFilter(name) {
  return ~ignoreKeys.indexOf(name) === 0;
}

function hasFilters(filters) {
  return getValidFilters(filters).length > 0;
}

function getValidFilters(filters) {
  return Object.keys(filters).filter(isValidFilter);
}

function getValidFilterData(data) {
  var d = {};
  var valid = getValidFilters(data);
  var i;

  for (i = 0; i < valid.length; i++) {
    d[valid[i]] = data[valid[i]];
  }

  return d;
}

function doDone(o, done) {
  return function (err) {
    if (err) { return done(err); }

    return done(null, o);
  };
}

function formFilter(filterKey, defaults) {
  var defaults = defaults || {};
  var doFormFilter = function (o, done) {
    var data = xtend(defaults, o.data);

    if (data.hasOwnProperty('clear')) {
      return o.session.set(filterKey, {}, doDone(o, done))
    }
    else if (hasFilters(data)) {
      o.formFilters = xtend(defaults, data);
      return o.session.set(filterKey, o.formFilters, doDone(o, done));
    }
    else {
      o.formFilters = o.session.get(filterKey) || {};
      return done(null, o);
    }
  };

  return new BarnacleMode(doFormFilter);
}

module.exports = formFilter;
