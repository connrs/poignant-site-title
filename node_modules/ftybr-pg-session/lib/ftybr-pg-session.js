var Sessions = require('sessions');
var PgStore = require('sessions-pg-store');

function pgSession(options) {
  var s = new Sessions(PgStore, { expires: null }, options);

  return middleware.bind(null, s);
}

function middleware(s, req, res, done) {
  s.httpRequest(req, res, onHttpRequest.bind(null, req, done));
}

function onHttpRequest(req, done, err, session) {
  if (err) {
    done(err);
  }
  else {
    req.session = session;
    done();
  }
}

module.exports = pgSession;
