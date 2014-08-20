var pg = require('pg');
var pgSugar = require('pg-sugar');
var pgSession = require('barnacle-pg-session');
var Bookshelf = require('bookshelf');
var knex = require('knex')({
  client: 'pg',
  connection: {
    host: process.env.DB_HOST,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    port: process.env.DB_PORT,
    charset: 'utf8'
  }
});

pg.defaults.parseInt8 = true;
Bookshelf.PG = Bookshelf(knex);

function init(app, done) {
  var connectionString = 'postgres://' + app.env.db.username + ':' + app.env.db.password + '@' + app.env.db.host + ':' + app.env.db.port + '/' + app.env.db.database

  app.pg = pg;
  app.pgConString = connectionString;
  app.storeClient = pgSugar(pg, connectionString);
  app.session = pgSession({pg: app.pg, conString: app.pgConString});
  done();
}

module.exports = init;
