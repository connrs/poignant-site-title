function addToRes(key, value) {
  return function (req, res, done) {
    res[key] = value;
    done();
  };
}

module.exports = addToRes;
