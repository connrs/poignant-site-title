var app = {};
var initEvents = require('./events');
var initSessionHandler = require('./session_handler');
var initConfiguration = require('./config');
var initDB = require('./db');
var initRouter = require('./router');
var initData = require('./data');
var initTemplates = require('./templates');
var initModels = require('./models');
var initControllers = require('./controllers');
var initMenuItems = require('./menu_items');
var initTypes = require('./types');
var initIDP = require('./idp');
var initStomp = require('./activemq');

app.env = {
  softwareVersion: 1,
  db: {
    host: process.env.DB_HOST,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    port: process.env.DB_PORT
  },
  stomp: {
    host: process.env.STOMP_HOST
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

    initStomp(app, function (err) {
      if (err) {
        callback(err);
        return;
      }

      initTypes(app, function (err) {
        if (err) {
          callback (err);
          return;
        }

        initData(app, function (err) {
          initConfiguration(app, function (err) {
            if (err) {
              callback(err);
              return;
            }

            initIDP(app, function (err) {
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
  });
}

module.exports = initialiseApp;
