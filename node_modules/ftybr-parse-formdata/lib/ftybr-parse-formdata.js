var url = require('url');
var xtend = require('xtend');
var qs = require('qs');
var jsonHeader = /^application\/([\w!#\$%&\*`\-\.\^~]*\+)?json$/i;

function parseFormdata(req, res, done) {
  var get = {};
  var queryString = url.parse(req.url).query;

  if (queryString) {
    get = qs.parse(queryString);
  }

  if (bodyHasData(req)) {
    captureRequestBody(req, res, mergeBodyWithData.bind(null, get, req, res, done));
  }
  else {
    req.data = get;
    done();
  }
}

function bodyHasData(req) {
  return isUrlEncoded(req) || isJsonBody(req);
}

function isUrlEncoded(req) {
  return req.headers['content-type'] === 'application/x-www-form-urlencoded';
}

function isJsonBody(req) {
  return jsonHeader.test(req.headers['content-type']);
}

function captureRequestBody(req, res, done) {
  var body = [];
  var errors = false;

  req.on('data', function (chunk) {
    body.push(chunk);
  });

  req.on('error', function (err) {
    errors = true;
    res.statusCode = 400;
    done(err);
  });

  req.on('end', function () {
    if (!errors) {
      done(null, Buffer.concat(body).toString());
    }
  });
}

function mergeBodyWithData(data, req, res, done, err, body) {
  if (err) {
    done(err);
  }
  else if (body === '') {
    res.statusCode = 400;
    done(new Error('Request body empty'));
  }
  else if (isUrlEncoded(req)) {
    mergeUrlEncodedBodyWithData(req, body, data, done);
  }
  else if (isJsonBody(req)) {
    mergeJsonBodyWithData(req, res, body, data, done);
  }
}

function mergeUrlEncodedBodyWithData(req, body, data, done) {
  req.data = xtend(data, qs.parse(body));
  done();
}

function mergeJsonBodyWithData(req, res, body, data, done) {
  try {
    req.data = xtend(data, JSON.parse(body));
    done();
  }
  catch (err) {
    res.statusCode = 400;
    done(err);
  }
}

module.exports = parseFormdata;
