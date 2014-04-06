var BarnacleMode = require('barnacle-mode');

function addTo(key, data) {
  var barnacle = new BarnacleMode(fuse.bind(null, key, data));
  return barnacle();
}

function fuse(key, data, o, done) {
  o[key] = data;
  done(null, o);
}

module.exports = addTo;
