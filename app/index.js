var app = {
  env: {
    softwareVersion: 1,
    secret: process.env.SECRET,
    db: {
      host: process.env.DB_HOST,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      port: process.env.DB_PORT
    },
    stomp: {
      host: process.env.STOMP_HOST,
      username: process.env.STOMP_USER,
      password: process.env.STOMP_PASS,
      port: process.env.STOMP_PORT
    }
  }
};
var steps = [
  require('./init/events.js'),
  require('./init/db.js'),
  require('./init/types.js'),
  require('./init/stores.js'),
  require('./init/config.js'),
  require('./init/idp.js'),
  require('./init/menu_items.js'),
  require('./init/controllers.js'),
  require('./init/request_listener.js')
];

function reduceStep(callback, done, step) {
  return function (err) {
    if (err) {
      callback(err);
    }
    else {
      step(app, done);
    }
  };
}

function finalStep(callback, err) {
  if (err) {
    callback(err);
  }
  else {
    callback(null, app);
  }
}

function init(callback) {
  steps.reduceRight(reduceStep.bind(null, callback), finalStep.bind(null, callback))();
}

module.exports = init;
