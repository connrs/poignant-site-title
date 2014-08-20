var cluster = require('cluster');
var fork = require('app/init/fork');
var forkWorker = require('app/init/fork-worker');

if (cluster.isMaster) {
  fork(cluster);
}
else {
  forkWorker({
    cluster: cluster,
    domain: require('domain'),
    logger: function (err) {
      console.error(err);
      console.error(err.stack);
    },
    launcher: require('./app'),
    createServer: require('http').createServer,
    serverPort: 8106
  });
}
