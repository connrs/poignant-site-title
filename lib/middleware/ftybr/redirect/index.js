var url = require('url');
function redirect(req, res, location, statusCode) {
  var protocol = !!req.connection.encrypted ? 'https' : 'http';
  var hostname = req.headers.host;
  var currentLocation = protocol + '://' + hostname + req.url;
  var newLocation = url.resolve(currentLocation, location);

  statusCode = statusCode || 200;
  res.setHeader('Location', newLocation);
  res.statusCode = statusCode;
  res.end();
}

module.exports = function (req, res, done) {
  res.redirect = redirect.bind(null, req, res);
  done();
};
