var app = {};
var initEvents = require('./events');
var initSessionHandler = require('./session_handler');
var initConfiguration = require('./config');
var initDB = require('./db');
var initRouter = require('./router');
var initProviders = require('./providers');
var initData = require('./data');
var initTemplates = require('./templates');
var initModels = require('./models');
var initControllers = require('./controllers');
var initMenuItems = require('./menu_items');
var initTypes = require('./types');

app.env = {
  softwareVersion: 1,
  db: {
    host: process.env.DB_HOST,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    port: process.env.DB_PORT
  }
};


function initialiseApp(callback) {
  initEvents(app);
  initDB(app, function (err, client) {
    if (err) {
      callback(err);
      return;
    }
    app.sessionHandler = initSessionHandler(app.dbClient);

    initTypes(app, function (err) {
      if (err) {
        callback (err);
        return;
      }

      initData(app, function (err) {
        initProviders(app, function (err) {
          if (err) {
            callback(err);
            return;
          }

          initConfiguration(app, function (err) {
            if (err) {
              callback(err);
              return;
            }

            initMenuItems(app, function (err) {
              if (err) {
                callback(err);
                return;
              }

              initTemplates(app, function(err) {
                if (err) {
                  callback(err);
                  return;
                }

                initModels(app);
                initControllers(app);

                initRouter(app, function (err) {
                  if (err) {
                    callback(err);
                    return;
                  }

                  callback(null, app);
                });
              });
            });
          });
        });
      });
    });
  });
}

module.exports = initialiseApp;
