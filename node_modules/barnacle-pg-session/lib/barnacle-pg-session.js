var Sessions = require('sessions');
var PgStore = require('sessions-pg-store');
var BarnacleMode = require('barnacle-mode');

function pgSession(options) {
  var sessions = new Sessions(PgStore, { expires: null }, options);

  return generateBarnacle.bind(null, sessions);
}

function generateBarnacle(sessions, req, res) {
  return new BarnacleMode(fuse.bind(null, sessions, req, res))();
}

function fuse(sessions, req, res, obj, done) {
  sessions.httpRequest(req, res, onHttpRequest.bind(null, obj, done));
}

function onHttpRequest(obj, done, err, session) {
  if (err) {
    return done(err);
  }

  obj.session = session;
  done(null, obj);
}

module.exports = pgSession;
