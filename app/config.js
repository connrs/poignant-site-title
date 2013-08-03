var newConfig = require('../lib/configure');

function rebuildConfig(app) {
  var getStandingData = 'SELECT key, value FROM standing_data WHERE deleted IS NULL';

  app.dbClient.query(getStandingData, function (err, results) {
    var config, c;
    var configure = newConfig(app.env);

    if (err) {
      app.events.emit('config_refreshed', err);
      return;
    }

    results.rows.forEach(function (standingData) {
      configure.set(standingData.key, standingData.value);
    });
    config = configure.get();

    for (c in config) {
      if (config.hasOwnProperty(c)) {
        app.config[c] = config[c];
      }
    }

    app.events.emit('config_refreshed');
  });
}

function initConfiguration(app, callback) {
  app.config = {};
  app.events.on('config_refresh', rebuildConfig.bind(null, app));
  app.events.once('config_refreshed', callback);
  app.events.emit('config_refresh');
}

module.exports = initConfiguration;
