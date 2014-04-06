var BarnacleMode = require('barnacle-mode');

function clean() {
  return new BarnacleMode(function (o, done) {
    var pipe = this;

    if (o.session && o.session.get && o.session.get('flash_message')) {
      o.session.set('flash_message', null, function (err) {
        if (err) {
          done(err);
        }
        else {
          done(null, o);
        }
      });
    }
    else {
      done(null, o);
    }
  });
}

module.exports = clean;
