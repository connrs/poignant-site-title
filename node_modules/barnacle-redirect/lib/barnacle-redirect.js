var BarnacleMode = require('barnacle-mode');
var url = require('url');

function redirect(res) {
  return new BarnacleMode(fuse.bind(null, res))();
}

function fuse(res, obj, done) {
  obj.redirect = function (location, statusCode) {
    res.setHeader('Location', getAbsoluteLocation(obj.req, location));
    res.statusCode = statusCode || 303;
    res.end();
  };
  done(null, obj);
}

function getAbsoluteLocation(req, location) {
  var protocol = !!req.connection.encrypted ? 'https' : 'http';
  var hostname = req.headers.host;
  var path = req.url;
  var currentLocation = protocol + '://' + hostname + path;

  return url.resolve(currentLocation, location);
}

module.exports = redirect;
