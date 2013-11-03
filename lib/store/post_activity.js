function PostActivityStore(pg) {
  if (!(this instanceof PostActivityStore)) {
    return new PostActivityStore(pg);
  }

  this._pg = pg;
}

PostActivityStore.prototype.getActivity = function (callback) {
  this._pg.client(function (err, query) {
    if (err) {
      callback(err);
    }
    else {
      var sql = [];
      var params = [];

      sql.push('SELECT *');
      sql.push('FROM post_activity');

      query(sql.join('\n'), params, function (err, results) {
        if (err) {
          callback(err);
        }
        else {
          callback(null, results.rows);
        }
      });
    }
  });
};

function postActivityStore(pg) {
  var store = new PostActivityStore(pg);
  return store;
}

module.exports = postActivityStore;
