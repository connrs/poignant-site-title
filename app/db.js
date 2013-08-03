var pg = require('pg');

function connectDB(app, callback) {
  var connectionString = 'postgres://' + app.env.db.username + ':' + app.env.db.password + '@' + app.env.db.host + ':' + app.env.db.port + '/' + app.env.db.database
  var client = new pg.Client(connectionString);
  client.connect(function (err) {
    if (err) {
      callback(err);
    }
    else {
      client.on('error', console.log.bind(console));
      client.on('notice', console.log.bind(console));
      client.on('notification', console.log.bind(console));
      app.dbClient = client;
      callback();
    }
  });
}

module.exports = connectDB;
