var net = require('net');
var repl = require('repl');
var http = require('http');
var initApp = require('./app');

Error.stackTraceLimit = Infinity;
initApp(function (err, app) {
  if (err) {
    console.error(err);
    return;
  }

  http.createServer(app.router.requestListener()).listen(8106);

  net.createServer(function (socket) {
    var r = repl.start({
      prompt: '> ',
      useColors: true,
      input: socket,
      output: socket
    });

    r.on('exit', socket.end.bind(socket));
    r.on('error', console.error.bind(console));
    socket.on('error', console.error.bind(console));
    r.context.app = app;
  }).listen(5001);
});
