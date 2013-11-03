var app = {
  env: {
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
  }
};
var steps = [
  require('./events.js'),
  require('./db.js'),
  require('./activemq.js'),
  require('./types.js'),
  require('./stores.js'),
  require('./config.js'),
  require('./idp.js'),
  require('./menu_items.js'),
  require('./templates.js'),
  require('./controllers.js'),
  require('./router.js')
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
