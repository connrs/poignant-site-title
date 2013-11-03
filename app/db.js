var pg = require('pg');
var pgSugar = require('pg-sugar');

pg.defaults.parseInt8 = true;

function init(app, done) {
  var connectionString = 'postgres://' + app.env.db.username + ':' + app.env.db.password + '@' + app.env.db.host + ':' + app.env.db.port + '/' + app.env.db.database

  app.pg = pg;
  app.pgConString = connectionString;
  app.storeClient = pgSugar(pg, connectionString);
  done();
}

module.exports = init;
