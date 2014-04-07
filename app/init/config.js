var newConfig = require('../../lib/configure');

function rebuildConfig(app) {
  var getStandingData = 'SELECT key, value FROM standing_data WHERE deleted IS NULL';

  app.storeClient.client(function (err, query) {
    if (err) {
      throw err;
    }

    query(getStandingData, [], function (err, results) {
      var config, c;
      var configure = newConfig(app.env);

      if (err) {
        app.events.emit('~config_refreshed', err);
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

      app.events.emit('~config_refreshed');
    });
  });
}

function init(app, callback) {
  app.config = {};
  app.events.on('config_refresh', rebuildConfig.bind(null, app));
  app.events.once('~config_refreshed', callback);
  rebuildConfig(app);
}

module.exports = init;
