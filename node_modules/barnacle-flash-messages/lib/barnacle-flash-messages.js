var BarnacleMode = require('barnacle-mode');

function flashMessages(types) {
  if (!Array.isArray(types)) { throw new Error('Please provide a list of flash message types.'); }

  return new BarnacleMode(function (o, done) {
    var t;

    for (t = 0; t < types.length; t++) {
      o[types[t]] = o.session.get(types[t]);
    }

    if (types.length) {
      clearFlashMessages(types, o, done);
    }
    else {
      done(null, o);
    }
  });
}

function clearFlashMessages(types, o, done) {
  var count = types.length;
  var cleanupComplete = function (err) {
    if (err) { return done(err); }

    if (!--count) { done(null, o); }
  };
  var t;

  for (t = 0; t < types.length; t++) {
    o.session.set(types[t], null, cleanupComplete);
  }
}

module.exports = flashMessages;
