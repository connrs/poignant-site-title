function addToReq(key, value) {
  return function (req, res, done) {
    req[key] = value;
    done();
  };
}

module.exports = addToReq;
