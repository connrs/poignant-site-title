var cluster = require('cluster');
var numWorkers = require('os').cpus().length;

if (cluster.isMaster) {
  // Fork workers
  for (var i = 0; i < numWorkers; i++) {
    cluster.fork();
  }

  cluster.on('disconnect', function (worker) {
    console.error('Disconnection');
    cluster.fork();
  });
}
else {
  var launch = require('./app');
  var http = require('http');

  launch(function (err, app) {
    var server;
    var requestHandler;

    if (err) {
      cluster.worker.disconnect();
      return console.error(err);
    }

    requestHandler = app.requestListener;
    server = http.createServer(function (req, res) {
      var d = require('domain').create();

      d.on('error', function(er) {
        console.error('error', er.stack);

        try {
          // make sure we close down within 30 seconds
          var killtimer = setTimeout(function() {
            process.exit(1);
          }, 30000);
          // But don't keep the process open just for that!
          killtimer.unref();

          // stop taking new requests.
          server.close();

          // Let the master know we're dead.  This will trigger a
          // 'disconnect' in the cluster master, and then it will fork
          // a new worker.
          cluster.worker.disconnect();

          // try to send an error to the request that triggered the problem
          res.statusCode = 500;
          res.setHeader('content-type', 'text/plain');
          res.end('Oops, there was a problem!\n');
        }
        catch (er2) {
          // oh well, not much we can do at this point.
          console.error('Error sending 500!', er2.stack);
        }
      });

      d.add(req);
      d.add(res);
      d.add(app);

      // Now run the handler function in the domain.
      d.run(function() {
        requestHandler(req, res);
      });
    });

    app.events.once('refresh_application', function () {
        // make sure we close down within 30 seconds
        var killtimer = setTimeout(function() {
          process.exit(1);
        }, 30000);
        // But don't keep the process open just for that!
        killtimer.unref();

        // stop taking new requests.
        server.close();

        // Let the master know we're dead.  This will trigger a
        // 'disconnect' in the cluster master, and then it will fork
        // a new worker.
        cluster.worker.disconnect();
    });

    server.listen(8106);
  });
}
